import Parser from 'rss-parser'
import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'

// ============================================================
// News Scraper Utilities
// RSS parsing, categorization, Venezuela filter, and translation
// ============================================================

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Umbral-News-Monitor/1.0',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
})

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
  scrapeHtml?: boolean           // true = scrape HTML instead of RSS
}

export const NEWS_SOURCES: SourceConfig[] = [
  { name: 'Efecto Cocuyo', url: 'https://efectococuyo.com', feedUrl: 'https://efectococuyo.com/feed/', lang: 'es' },
  { name: 'El Pitazo', url: 'https://elpitazo.net', feedUrl: 'https://elpitazo.net/feed/', lang: 'es' },
  { name: 'Runrunes', url: 'https://runrun.es', feedUrl: 'https://runrun.es/feed/', lang: 'es' },
  { name: 'Crónica Uno', url: 'https://cronica.uno', feedUrl: 'https://cronica.uno/feed/', lang: 'es', skipVenezuelaFilter: true },
  { name: 'El Estímulo', url: 'https://elestimulo.com', feedUrl: 'https://elestimulo.com/feed/', lang: 'es', skipVenezuelaFilter: true },
  { name: 'Caraota Digital', url: 'https://www.caraotadigital.net', feedUrl: 'https://www.caraotadigital.net/feed/', lang: 'es', skipVenezuelaFilter: true },
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
    const feed = await parser.parseURL(url)
    return feed.items.map(item => ({
      title: item.title?.trim() || '',
      link: item.link?.trim() || '',
      description: stripHtml(item.contentSnippet || item.content || item.summary || '').slice(0, 500),
      pubDate: item.pubDate || item.isoDate || '',
      categories: (item.categories || []).map(c => typeof c === 'string' ? c : ''),
    }))
  } catch (err) {
    // Page doesn't exist or feed error — return empty
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
// HTML SCRAPING (for sites without RSS feeds)
// ============================================================

const MONTH_MAP: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
}

/**
 * Parse a Spanish date string like "febrero 12, 2026" into a Date.
 */
function parseSpanishDate(dateStr: string): Date | null {
  const match = dateStr.trim().toLowerCase().match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (!match) return null
  const month = MONTH_MAP[match[1]]
  if (month === undefined) return null
  return new Date(Number(match[3]), month, Number(match[2]))
}

/**
 * Scrape articles from Tal Cual's homepage via HTML parsing.
 * Structure: .post_attribute contains the date, sibling <a> has the headline and link.
 */
export async function scrapeTalCualArticles(
  siteUrl: string,
  cutoffDate: Date,
  maxPages: number = 5
): Promise<RSSArticle[]> {
  const allArticles: RSSArticle[] = []
  const seenLinks = new Set<string>()

  for (let page = 1; page <= maxPages; page++) {
    const url = page > 1 ? `${siteUrl}/page/${page}/` : siteUrl
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Umbral-News-Monitor/1.0' },
      })
      if (!res.ok) break

      const html = await res.text()
      const $ = cheerio.load(html)

      let hasOlderThanCutoff = false
      let foundOnPage = 0

      // Each article block has a .post_attribute (date) and a sibling <a> (link + headline)
      $('.post_attribute').each((_, el) => {
        const dateText = $(el).text().trim()
        const pubDate = parseSpanishDate(dateText)
        if (!pubDate) return

        if (pubDate < cutoffDate) {
          hasOlderThanCutoff = true
          return
        }

        // Find the sibling link in the same parent container
        const parent = $(el).parent()
        const linkEl = parent.find('a[href*="talcualdigital.com/"]').first()
        const link = linkEl.attr('href') || ''
        const title = linkEl.text().trim()

        if (!link || !title) return
        if (/\/(category|tag|page|autor|author)\//i.test(link)) return
        if (seenLinks.has(link)) return

        seenLinks.add(link)
        allArticles.push({
          title,
          link,
          description: '',
          pubDate: pubDate.toISOString(),
          categories: [],
        })
        foundOnPage++
      })

      console.log(`   [HTML] Page ${page}: found ${foundOnPage} articles`)
      if (hasOlderThanCutoff || foundOnPage === 0) break

      // Delay between pages
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      console.error(`   [HTML] Error fetching page ${page}:`, err instanceof Error ? err.message : err)
      break
    }
  }

  return allArticles
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
