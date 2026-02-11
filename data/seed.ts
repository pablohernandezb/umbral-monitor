/**
 * Supabase Seed Script
 *
 * Run this script to populate your Supabase database with initial data.
 *
 * Prerequisites:
 * 1. Create a Supabase project
 * 2. Run the schema SQL from lib/supabase.ts
 * 3. Set environment variables:
 *    - NEXT_PUBLIC_SUPABASE_URL
 *    - SUPABASE_SERVICE_ROLE_KEY (needed for seeding)
 *
 * Usage: npm run seed
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })
import {
  mockScenarios,
  mockRegimeHistory,
  mockNewsFeed,
  mockPoliticalPrisoners,
  mockPrisonersByOrg,
  mockDEEDEvents,
  mockReadingRoom,
  mockHistoricalEpisodes,
} from './mock'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Starting database seed...\n')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Clearing existing data...')
  const clearErrors = []

  const { error: newsDeleteError } = await supabase.from('news_feed').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (newsDeleteError) clearErrors.push(`news_feed: ${newsDeleteError.message}`)

  const { error: eventsDeleteError } = await supabase.from('events_deed').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (eventsDeleteError) clearErrors.push(`events_deed: ${eventsDeleteError.message}`)

  const { error: readingDeleteError } = await supabase.from('reading_room').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (readingDeleteError) clearErrors.push(`reading_room: ${readingDeleteError.message}`)

  const { error: prisonersDeleteError } = await supabase.from('political_prisoners').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (prisonersDeleteError) clearErrors.push(`political_prisoners: ${prisonersDeleteError.message}`)

  const { error: orgsDeleteError } = await supabase.from('prisoners_by_organization').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (orgsDeleteError) clearErrors.push(`prisoners_by_organization: ${orgsDeleteError.message}`)

  const { error: episodesDeleteError } = await supabase.from('historical_episodes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (episodesDeleteError) clearErrors.push(`historical_episodes: ${episodesDeleteError.message}`)

  if (clearErrors.length > 0) {
    console.log('  ⚠️ Some tables could not be cleared:', clearErrors.join(', '))
  } else {
    console.log('  ✅ Existing data cleared\n')
  }

  // Seed scenarios
  console.log('📊 Seeding scenarios...')
  const { error: scenariosError } = await supabase
    .from('scenarios')
    .upsert(mockScenarios.map(s => ({
      key: s.key,
      probability: s.probability,
      probability_label: s.probability_label,
      status: s.status,
    })), { onConflict: 'key' })
  
  if (scenariosError) {
    console.error('  ❌ Error:', scenariosError.message)
  } else {
    console.log('  ✅ Scenarios seeded successfully')
  }

  // Seed regime history
  console.log('📈 Seeding regime history...')
  const { error: historyError } = await supabase
    .from('regime_history')
    .upsert(mockRegimeHistory.map(h => ({
      year: h.year,
      electoral_democracy_index: h.electoral_democracy_index,
      regime_type: h.regime_type,
      episode_type: h.episode_type,
      notes: h.notes,
    })), { onConflict: 'year' })
  
  if (historyError) {
    console.error('  ❌ Error:', historyError.message)
  } else {
    console.log('  ✅ Regime history seeded successfully')
  }

  // Seed news feed
  console.log('📰 Seeding news feed...')
  const { error: newsError } = await supabase
    .from('news_feed')
    .insert(mockNewsFeed.map(n => ({
      source: n.source,
      source_url: n.source_url,
      headline: n.headline,
      summary: n.summary,
      external_url: n.external_url,
      category: n.category,
      is_breaking: n.is_breaking,
      published_at: n.published_at,
    })))
  
  if (newsError) {
    console.error('  ❌ Error:', newsError.message)
  } else {
    console.log('  ✅ News feed seeded successfully')
  }

  // Seed political prisoners
  console.log('⚖️ Seeding political prisoners...')
  const { error: prisonersError } = await supabase
    .from('political_prisoners')
    .insert(mockPoliticalPrisoners.map(p => ({
      data_date: p.date,
      total_count: p.total,
      releases_30d: p.released,
      civilians: p.civilians,
      military: p.military,
      men: p.men,
      women: p.women,
      adults: p.adults,
      minors: p.minors,
      foreign: p.foreign,
      unknown: p.unknown,
      source: p.source,
    })))
  
  if (prisonersError) {
    console.error('  ❌ Error:', prisonersError.message)
  } else {
    console.log('  ✅ Political prisoners seeded successfully')
  }

  // Seed prisoners by organization
  console.log('🏢 Seeding prisoners by organization...')
  const { error: orgError } = await supabase
    .from('prisoners_by_organization')
    .insert(mockPrisonersByOrg.map(o => ({
      organization: o.organization,
      count: o.count,
      data_date: o.date,
    })))
  
  if (orgError) {
    console.error('  ❌ Error:', orgError.message)
  } else {
    console.log('  ✅ Prisoners by organization seeded successfully')
  }

  // Seed DEED events
  console.log('📅 Seeding DEED events...')
  const { error: eventsError } = await supabase
    .from('events_deed')
    .insert(mockDEEDEvents.map(e => ({
      year: e.year,
      type: e.type,
      category: e.category,
      description_en: e.description_en,
      description_es: e.description_es,
      month: e.month,
      actors: e.actors,
      targets: e.targets,
    })))
  
  if (eventsError) {
    console.error('  ❌ Error:', eventsError.message)
  } else {
    console.log('  ✅ DEED events seeded successfully')
  }

  // Seed reading room
  console.log('📚 Seeding reading room...')
  const { error: readingError } = await supabase
    .from('reading_room')
    .insert(mockReadingRoom.map(r => ({
      title_en: r.title_en,
      title_es: r.title_es,
      author: r.author,
      year: r.year,
      type: r.type,
      language: r.language,
      description_en: r.description_en,
      description_es: r.description_es,
      external_url: r.external_url,
      tags_en: r.tags_en,
      tags_es: r.tags_es,
    })))
  
  if (readingError) {
    console.error('  ❌ Error:', readingError.message)
  } else {
    console.log('  ✅ Reading room seeded successfully')
  }

  // Seed historical episodes
  console.log('🏛️ Seeding historical episodes...')
  const { error: episodesError } = await supabase
    .from('historical_episodes')
    .upsert(mockHistoricalEpisodes.map(e => ({
      key: e.key,
      start_year: e.start_year,
      end_year: e.end_year,
      episode_type: e.episode_type,
    })), { onConflict: 'key' })
  
  if (episodesError) {
    console.error('  ❌ Error:', episodesError.message)
  } else {
    console.log('  ✅ Historical episodes seeded successfully')
  }

  console.log('\n✨ Database seeding complete!')
}

seed().catch(console.error)
