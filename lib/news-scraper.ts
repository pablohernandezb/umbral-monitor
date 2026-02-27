import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from './supabase-server'

// ============================================================
// News Scraper Utilities
// RSS parsing, categorization, Venezuela filter, and translation
// ============================================================

const parser = new Parser()

export interface RSSArticle {
  title: string
  link: string
  description: string
  pubDate: string
  categories: string[]
}

export interface SourceConfig {
  name: string
  url: string         // Homepage (source_url)
  feedUrl: string     // RSS feed URL (empty string if HTML-only)
  lang: 'es' | 'en'
  skipVenezuelaFilter?: boolean  // true for Venezuela-only sites
}

export const NEWS_SOURCES: SourceConfig[] = [
  { name: 'Efecto Cocuyo', url: 'https://efectococuyo.com', feedUrl: 'https://efectococuyo.com/feed/', lang: 'es' },
  { name: 'El Pitazo', url: 'https://elpitazo.net', feedUrl: 'https://elpitazo.net/feed/', lang: 'es' },
  { name: 'Runrunes', url: 'https://runrun.es', feedUrl: 'https://runrun.es/feed/', lang: 'es' },
  { name: 'El Nacional', url: 'https://elnacional.com', feedUrl: 'https://elnacional.com/feed/', lang: 'es' },
  { name: 'Monitoreamos', url: 'https://monitoreamos.com', feedUrl: 'https://monitoreamos.com/feed/', lang: 'es' },
  { name: 'Tal Cual', url: 'https://talcualdigital.com', feedUrl: 'https://talcualdigital.com/feed/', lang: 'es', skipVenezuelaFilter: true },
  { name: 'El Estímulo', url: 'https://elestimulo.com', feedUrl: 'https://elestimulo.com/feed/', lang: 'es', skipVenezuelaFilter: true },
  { name: 'La Gran Aldea', url: 'https://lagranaldea.com', feedUrl: 'https://lagranaldea.com/feed/', lang: 'es', skipVenezuelaFilter: true },
  { name: 'Analítica', url: 'https://www.analitica.com', feedUrl: 'https://www.analitica.com/feed/', lang: 'es', skipVenezuelaFilter: true },
  { name: 'Caracas Chronicles', url: 'https://www.caracaschronicles.com', feedUrl: 'https://www.caracaschronicles.com/feed/', lang: 'en' },
]

// ============================================================
// RSS FEED FETCHING
// ============================================================

/**
 * Fetch a single page of an RSS feed. WordPress supports ?paged=N pagination.
 */
export async function fetchRSSPage(feedUrl: string, page: number = 1): Promise<RSSArticle[]> {
  const url = page > 1 ? `${feedUrl}?paged=${page}` : feedUrl

  try {
    // Use fetch + parseString so HTTP 4xx/5xx responses that still return
    // valid RSS content are handled correctly (e.g. Tal Cual returns 404
    // with a full valid feed body due to a server misconfiguration).
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Umbral-News-Monitor/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    })
    const text = await res.text()
    // Bail early if the body is clearly not XML (e.g. an HTML error page)
    if (!text.trimStart().startsWith('<')) return []
    const feed = await parser.parseString(text)
    return feed.items.map(item => ({
      title: item.title?.trim() || '',
      link: item.link?.trim() || '',
      description: stripHtml(item.contentSnippet || item.content || item.summary || '').slice(0, 500),
      pubDate: item.pubDate || item.isoDate || '',
      categories: (item.categories || []).map(c => typeof c === 'string' ? c : ''),
    }))
  } catch (err) {
    // Page 2+ not existing is expected — only log errors on the first page
    if (page === 1) {
      console.error(`[RSS] Failed to fetch ${url}:`, err instanceof Error ? err.message : err)
    }
    return []
  }
}

/**
 * Fetch all RSS pages from a feed going back to a cutoff date.
 * Paginates through WordPress ?paged=N until no more results or past cutoff.
 */
export async function fetchAllRSSArticles(
  feedUrl: string,
  cutoffDate: Date,
  maxPages: number = 50,
  limit?: number
): Promise<RSSArticle[]> {
  const allArticles: RSSArticle[] = []

  for (let page = 1; page <= maxPages; page++) {
    const articles = await fetchRSSPage(feedUrl, page)

    if (articles.length === 0) break

    let hasOlderThanCutoff = false
    for (const article of articles) {
      // If limit is set and we've reached it, stop
      if (limit && allArticles.length >= limit) {
        return allArticles
      }

      const articleDate = new Date(article.pubDate)
      if (articleDate >= cutoffDate) {
        allArticles.push(article)
      } else {
        hasOlderThanCutoff = true
      }
    }

    // If we found articles older than the cutoff, no need to paginate further
    if (hasOlderThanCutoff) break

    // If limit is set and we've reached it, stop
    if (limit && allArticles.length >= limit) break

    // Small delay between pages
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return limit ? allArticles.slice(0, limit) : allArticles
}

// ============================================================
// CATEGORY DETECTION
// ============================================================

const CATEGORY_MAP: Record<string, { en: string; es: string }> = {
  political: { en: 'political', es: 'política' },
  economic: { en: 'economic', es: 'economía' },
  social: { en: 'social', es: 'social' },
  international: { en: 'international', es: 'internacional' },
}

const CATEGORY_PATTERNS: Array<{ patterns: RegExp; category: string }> = [
  { patterns: /pol[ií]tic|poder|gobierno|elecciones|oposici[oó]n|presos|ddhh|derechos humanos|political|government|election|opposition|prisoners/i, category: 'political' },
  { patterns: /econom[ií]|finanzas|inflaci[oó]n|d[oó]lar|petr[oó]leo|pdvsa|salario|economic|finance|inflation|oil/i, category: 'economic' },
  { patterns: /sociedad|social|salud|educaci[oó]n|migraci[oó]n|health|education|migration|society/i, category: 'social' },
  { patterns: /internacionales?|mundial?|world|international|diplomacia|sanciones|sanctions/i, category: 'international' },
]

/**
 * Detect category from URL path, RSS categories, and title.
 */
export function detectCategory(
  url: string,
  title: string,
  rssCategories: string[]
): { en: string; es: string } {
  const textToCheck = `${url} ${title} ${rssCategories.join(' ')}`

  for (const { patterns, category } of CATEGORY_PATTERNS) {
    if (patterns.test(textToCheck)) {
      return CATEGORY_MAP[category]
    }
  }

  // Default to political for Venezuela news
  return CATEGORY_MAP.political
}

// ============================================================
// VENEZUELA RELEVANCE FILTER
// ============================================================

const VENEZUELA_KEYWORDS = /venezuela|venezolan[oa]s?|caracas|maduro|guaid[oó]|gonz[aá]lez urrutia|machado|cne|psuv|pdvsa|chavismo|chavista|anc|tsj|fanb|dgcim|sebin|cicpc|mpp|an |asamblea nacional|bol[ií]var/i

/**
 * Check if an article is related to Venezuela.
 */
export function isVenezuelaRelated(title: string, description: string): boolean {
  return VENEZUELA_KEYWORDS.test(title) || VENEZUELA_KEYWORDS.test(description)
}

// ============================================================
// TRANSLATION VIA CLAUDE HAIKU
// ============================================================

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

interface TranslationItem {
  headline: string
  summary: string
}

/**
 * Translate a batch of headlines + summaries using Claude Haiku.
 * Returns translations in the same order as input.
 */
export async function translateBatch(
  items: TranslationItem[],
  fromLang: 'es' | 'en',
  toLang: 'es' | 'en'
): Promise<TranslationItem[]> {
  if (items.length === 0) return []

  const client = getAnthropicClient()
  const fromLabel = fromLang === 'es' ? 'Spanish' : 'English'
  const toLabel = toLang === 'es' ? 'Spanish' : 'English'

  const itemsJson = JSON.stringify(items.map((item, i) => ({
    i,
    headline: item.headline,
    summary: item.summary,
  })))

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Translate these news headlines and summaries from ${fromLabel} to ${toLabel}.
Return ONLY a JSON array with objects containing "i", "headline", and "summary" fields. No markdown, no explanation.

Input:
${itemsJson}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[translate] Could not parse JSON from response:', text.slice(0, 200))
      return items.map(item => ({ headline: item.headline, summary: item.summary }))
    }

    const translated = JSON.parse(jsonMatch[0]) as Array<{ i: number; headline: string; summary: string }>
    // Sort by index and return
    translated.sort((a, b) => a.i - b.i)
    return translated.map(t => ({ headline: t.headline, summary: t.summary }))
  } catch (err) {
    console.error('[translate] Translation error:', err instanceof Error ? err.message : err)
    // Return originals as fallback
    return items.map(item => ({ headline: item.headline, summary: item.summary }))
  }
}

// ============================================================
// UTILITIES
// ============================================================

// ============================================================
// MAIN SCRAPER ORCHESTRATOR
// ============================================================

export interface ScrapeResult {
  source: string
  status: 'inserted' | 'skipped' | 'error'
  url?: string
  error?: string
}

export interface RunScraperResult {
  timestamp: string
  processed: number
  results: ScrapeResult[]
}

/**
 * Fetch the most recent Venezuela-related article from every NEWS_SOURCE,
 * translate it to the missing language, and upsert into the news_feed table.
 * Runs all source fetches in parallel, then batches translation calls.
 */
export async function runNewsScraper(): Promise<RunScraperResult> {
  const db = createAdminClient()
  if (!db) throw new Error('Database not configured (missing service role key)')

  // 24-hour lookback window — fetch articles published since yesterday
  const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000)

  // ── 1. Fetch all sources in parallel ──────────────────────
  const fetched = await Promise.allSettled(
    NEWS_SOURCES.map(async source => {
      const articles = await fetchAllRSSArticles(source.feedUrl, cutoffDate, 2, 10)
      const filtered = source.skipVenezuelaFilter
        ? articles
        : articles.filter(a => isVenezuelaRelated(a.title, a.description))

      if (filtered.length === 0) return { source, article: null }

      filtered.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      return { source, article: filtered[0] }
    })
  )

  // Separate fulfilled results into "has article" and "no article"
  type FetchedItem = { source: SourceConfig; article: RSSArticle }
  const toProcess: FetchedItem[] = []
  const results: ScrapeResult[] = []

  fetched.forEach((outcome, i) => {
    const sourceName = NEWS_SOURCES[i].name
    if (outcome.status === 'rejected') {
      results.push({ source: sourceName, status: 'error', error: String(outcome.reason) })
    } else if (!outcome.value.article) {
      results.push({ source: sourceName, status: 'skipped' })
    } else {
      toProcess.push(outcome.value as FetchedItem)
    }
  })

  if (toProcess.length === 0) {
    return { timestamp: new Date().toISOString(), processed: 0, results }
  }

  // ── 2. Batch translate ─────────────────────────────────────
  const esItems = toProcess.filter(a => a.source.lang === 'es')
  const enItems = toProcess.filter(a => a.source.lang === 'en')

  const [esTranslated, enTranslated] = await Promise.all([
    esItems.length > 0
      ? translateBatch(esItems.map(a => ({ headline: a.article.title, summary: a.article.description })), 'es', 'en')
      : Promise.resolve([]),
    enItems.length > 0
      ? translateBatch(enItems.map(a => ({ headline: a.article.title, summary: a.article.description })), 'en', 'es')
      : Promise.resolve([]),
  ])

  // ── 3. Upsert each article ────────────────────────────────
  let esIdx = 0
  let enIdx = 0

  for (const { source, article } of toProcess) {
    const category = detectCategory(article.link, article.title, article.categories)
    const isEs = source.lang === 'es'

    let headline_en: string, headline_es: string
    let summary_en: string | null, summary_es: string | null

    if (isEs) {
      const t = esTranslated[esIdx++]
      headline_es = article.title
      headline_en = t?.headline || article.title
      summary_es = article.description?.slice(0, 500) || null
      summary_en = t?.summary?.slice(0, 500) || null
    } else {
      const t = enTranslated[enIdx++]
      headline_en = article.title
      headline_es = t?.headline || article.title
      summary_en = article.description?.slice(0, 500) || null
      summary_es = t?.summary?.slice(0, 500) || null
    }

    const row = {
      source: source.name,
      source_url: source.url,
      headline_en,
      headline_es,
      summary_en,
      summary_es,
      external_url: article.link,
      category_en: category.en as 'political' | 'economic' | 'social' | 'international',
      category_es: category.es as 'política' | 'economía' | 'social' | 'internacional',
      is_breaking: false,
      published_at: new Date(article.pubDate).toISOString(),
      votes_scenario_1: 0,
      votes_scenario_2: 0,
      votes_scenario_3: 0,
      votes_scenario_4: 0,
      votes_scenario_5: 0,
    }

    const { error } = await db
      .from('news_feed')
      .upsert(row, { onConflict: 'external_url', ignoreDuplicates: true })

    if (error) {
      results.push({ source: source.name, status: 'error', url: article.link, error: error.message })
    } else {
      results.push({ source: source.name, status: 'inserted', url: article.link })
    }
  }

  return {
    timestamp: new Date().toISOString(),
    processed: toProcess.length,
    results,
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Strip HTML tags from a string.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
