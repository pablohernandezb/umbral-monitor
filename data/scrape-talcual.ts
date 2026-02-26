/**
 * One-off script to scrape only Tal Cual articles via RSS.
 * Usage: npx tsx data/scrape-talcual.ts
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
} from '../lib/news-scraper'

const CUTOFF_DATE = new Date('2026-02-09T00:00:00Z')

async function main() {
  const source = NEWS_SOURCES.find(s => s.name === 'Tal Cual')
  if (!source) {
    console.error('Tal Cual source not found')
    return
  }

  console.log('Fetching Tal Cual via RSS...')
  const articles = await fetchAllRSSArticles(source.feedUrl, CUTOFF_DATE)
  console.log(`Found ${articles.length} articles`)

  const filtered = source.skipVenezuelaFilter
    ? articles
    : articles.filter(a => isVenezuelaRelated(a.title, a.description))
  console.log(`${filtered.length} Venezuela-related after filtering`)

  if (filtered.length === 0) {
    console.log('No articles to insert.')
    return
  }

  const categorized = filtered.map(a => ({
    ...a,
    category: detectCategory(a.link, a.title, a.categories),
  }))

  const items = categorized.map(a => ({ headline: a.title, summary: a.description || '' }))
  console.log(`Translating ${items.length} items...`)
  const translations = await translateBatch(items, 'es', 'en')

  const rows = categorized.map((a, i) => ({
    source: source.name,
    source_url: source.url,
    headline_en: translations[i].headline,
    headline_es: a.title,
    summary_en: translations[i].summary || null,
    summary_es: a.description || null,
    external_url: a.link,
    category_en: a.category.en,
    category_es: a.category.es,
    is_breaking: false,
    published_at: new Date(a.pubDate).toISOString(),
  }))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error, data } = await supabase
    .from('news_feed')
    .upsert(rows, { onConflict: 'external_url', ignoreDuplicates: true })
    .select('id')

  if (error) {
    console.error('Supabase error:', error.message)
  } else {
    console.log(`Inserted ${data?.length || rows.length} articles`)
  }
}

main().catch(console.error)
