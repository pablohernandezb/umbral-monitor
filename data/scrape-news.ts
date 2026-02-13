/**
 * News Scraper — Backfill Script
 *
 * Fetches articles from 8 Venezuelan news RSS feeds,
 * auto-categorizes, translates via Claude Haiku, and upserts into news_feed.
 *
 * Prerequisites:
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - ANTHROPIC_API_KEY in .env.local
 *
 * Usage: npx tsx data/scrape-news.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import {
  NEWS_SOURCES,
  fetchAllRSSArticles,
  detectCategory,
  isVenezuelaRelated,
  translateBatch,
  type RSSArticle,
  type SourceConfig,
} from '../lib/news-scraper'

// ============================================================
// CONFIG
// ============================================================

const CUTOFF_DATE = new Date('2026-02-12T00:00:00Z')
const TRANSLATION_BATCH_SIZE = 10
const ARTICLES_LIMIT = 10  // Fetch only the 10 most recent articles per source

// ============================================================
// SUPABASE CLIENT (service role for writes)
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Missing ANTHROPIC_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

// ============================================================
// MAIN
// ============================================================

interface ProcessedArticle {
  source: string
  source_url: string
  headline_en: string
  headline_es: string
  summary_en: string | null
  summary_es: string | null
  external_url: string
  category_en: string
  category_es: string
  is_breaking: boolean
  published_at: string
}

async function processSource(source: SourceConfig): Promise<ProcessedArticle[]> {
  console.log(`\n📡 Fetching ${source.name} (${source.feedUrl})...`)

  const articles = await fetchAllRSSArticles(source.feedUrl, CUTOFF_DATE, 50, ARTICLES_LIMIT)
  console.log(`   Found ${articles.length} recent articles (limit: ${ARTICLES_LIMIT})`)

  // Filter for Venezuela relevance
  let filtered: RSSArticle[]
  if (source.skipVenezuelaFilter) {
    filtered = articles
  } else {
    filtered = articles.filter(a => isVenezuelaRelated(a.title, a.description))
    console.log(`   ${filtered.length} Venezuela-related after filtering`)
  }

  if (filtered.length === 0) return []

  // Detect categories
  const categorized = filtered.map(article => ({
    ...article,
    category: detectCategory(article.link, article.title, article.categories),
  }))

  // Translate in batches
  const processed: ProcessedArticle[] = []

  for (let i = 0; i < categorized.length; i += TRANSLATION_BATCH_SIZE) {
    const batch = categorized.slice(i, i + TRANSLATION_BATCH_SIZE)

    const itemsToTranslate = batch.map(a => ({
      headline: a.title,
      summary: a.description || '',
    }))

    const fromLang = source.lang
    const toLang = source.lang === 'es' ? 'en' as const : 'es' as const

    console.log(`   🔄 Translating batch ${Math.floor(i / TRANSLATION_BATCH_SIZE) + 1}/${Math.ceil(categorized.length / TRANSLATION_BATCH_SIZE)} (${batch.length} items, ${fromLang}→${toLang})...`)

    const translations = await translateBatch(itemsToTranslate, fromLang, toLang)

    for (let j = 0; j < batch.length; j++) {
      const article = batch[j]
      const translation = translations[j]

      const headline_es = source.lang === 'es' ? article.title : translation.headline
      const headline_en = source.lang === 'en' ? article.title : translation.headline
      const summary_es = source.lang === 'es' ? (article.description || null) : (translation.summary || null)
      const summary_en = source.lang === 'en' ? (article.description || null) : (translation.summary || null)

      processed.push({
        source: source.name,
        source_url: source.url,
        headline_en,
        headline_es,
        summary_en,
        summary_es,
        external_url: article.link,
        category_en: article.category.en,
        category_es: article.category.es,
        is_breaking: false,
        published_at: new Date(article.pubDate).toISOString(),
      })
    }

    // Delay between translation batches
    if (i + TRANSLATION_BATCH_SIZE < categorized.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return processed
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║   Umbral News Scraper — Backfill Script      ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`\nCutoff date: ${CUTOFF_DATE.toISOString().split('T')[0]}`)
  console.log(`Sources: ${NEWS_SOURCES.length}`)
  console.log(`Translation: Claude Haiku (${TRANSLATION_BATCH_SIZE} per batch)`)

  let totalInserted = 0
  let totalErrors = 0

  for (const source of NEWS_SOURCES) {
    try {
      const articles = await processSource(source)

      if (articles.length === 0) {
        console.log(`   ⚠️  No articles to insert for ${source.name}`)
        continue
      }

      // Upsert into Supabase (use external_url as uniqueness key)
      // Insert in chunks of 50 to avoid payload limits
      const chunkSize = 50
      let sourceInserted = 0

      for (let i = 0; i < articles.length; i += chunkSize) {
        const chunk = articles.slice(i, i + chunkSize)

        const { error, data } = await supabase
          .from('news_feed')
          .upsert(chunk, {
            onConflict: 'external_url',
            ignoreDuplicates: true,
          })
          .select('id')

        if (error) {
          console.error(`   ❌ Supabase error for ${source.name}: ${error.message}`)
          totalErrors++
        } else {
          sourceInserted += data?.length || chunk.length
        }
      }

      console.log(`   ✅ ${source.name}: ${sourceInserted} articles inserted`)
      totalInserted += sourceInserted
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`   ❌ Failed ${source.name}: ${message}`)
      totalErrors++
    }
  }

  console.log('\n══════════════════════════════════════════════')
  console.log(`✅ Total inserted: ${totalInserted}`)
  if (totalErrors > 0) console.log(`❌ Errors: ${totalErrors}`)
  console.log('Done!')
}

main().catch(console.error)
