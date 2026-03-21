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
  mockBlockedDomains,
  mockGacetaRecords,
} from './mock'
import { getLabelForChangeType } from '../components/gaceta/gaceta-utils'

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

  // Only clear tables that use mock data for seeding.
  // Tables with production/scraped data (news_feed) are NEVER cleared.
  const SAFE_TO_CLEAR = [
    'events_deed',
    'reading_room',
    'political_prisoners',
    'prisoners_by_organization',
    'historical_episodes',
    'expert_submissions',
    'public_submissions',
  ] as const

  console.log('🧹 Clearing seed-managed tables (preserving news_feed, scenarios, regime_history)...')
  const clearErrors = []

  for (const table of SAFE_TO_CLEAR) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) clearErrors.push(`${table}: ${error.message}`)
  }

  if (clearErrors.length > 0) {
    console.log('  ⚠️ Some tables could not be cleared:', clearErrors.join(', '))
  } else {
    console.log('  ✅ Seed-managed tables cleared\n')
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

  // Seed expert submissions
  console.log('🎓 Seeding expert submissions...')
  const { error: expertError } = await supabase
    .from('expert_submissions')
    .insert([
      {
        name: 'Dr. María González',
        email: 'mgonzalez@ucv.edu.ve',
        institution: 'Universidad Central de Venezuela',
        ideology_score: 4,
        scenario_probabilities: { 1: 2, 2: 3, 3: 4, 4: 3, 5: 2 },
        status: 'pending',
        submitted_at: '2026-02-10T14:30:00Z',
      },
      {
        name: 'Prof. James Mitchell',
        email: 'jmitchell@georgetown.edu',
        institution: 'Georgetown University',
        ideology_score: 6,
        scenario_probabilities: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 3 },
        status: 'pending',
        submitted_at: '2026-02-11T09:15:00Z',
      },
      {
        name: 'Dr. Ana Palacios',
        email: 'apalacios@usb.ve',
        institution: 'Universidad Simón Bolívar',
        ideology_score: 3,
        scenario_probabilities: { 1: 3, 2: 4, 3: 3, 4: 2, 5: 1 },
        status: 'approved',
        submitted_at: '2026-02-11T16:45:00Z',
        reviewed_at: '2026-02-11T17:00:00Z',
      },
    ])

  if (expertError) {
    console.error('  ❌ Error:', expertError.message)
  } else {
    console.log('  ✅ Expert submissions seeded successfully')
  }

  // Seed public submissions
  console.log('📊 Seeding public submissions...')
  const { error: publicSubError } = await supabase
    .from('public_submissions')
    .insert([
      { email: 'ciudadano1@gmail.com', resolved_scenario: 2, path: [true, false, false], status: 'published', submitted_at: '2026-02-10T10:20:00Z' },
      { email: 'observer@outlook.com', resolved_scenario: 4, path: [true, true, false], status: 'published', submitted_at: '2026-02-11T11:30:00Z' },
      { email: 'watcher@proton.me', resolved_scenario: 1, path: [false], status: 'published', submitted_at: '2026-02-12T08:00:00Z' },
      { email: 'analista@gmail.com', resolved_scenario: 5, path: [true, true, true], status: 'published', submitted_at: '2026-02-12T12:00:00Z' },
      { email: 'observador2@yahoo.com', resolved_scenario: 3, path: [true, false, true], status: 'published', submitted_at: '2026-02-12T13:45:00Z' },
    ])

  if (publicSubError) {
    console.error('  ❌ Error:', publicSubError.message)
  } else {
    console.log('  ✅ Public submissions seeded successfully')
  }

  // Seed blocked domains
  await seedBlockedDomains(supabase)

  // Seed gazette records
  await seedGaceta(supabase)

  console.log('\n✨ Database seeding complete!')
}

async function seedBlockedDomains(supabase: any) {
  console.log('🔒 Seeding blocked domains...')

  const fs = await import('fs')
  const path = await import('path')

  const csvPath = path.join(process.cwd(), 'data', 'blocking-data.csv')
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  blocking-data.csv not found in data/ — using mock data instead')

    // Fall back to mock data
    await supabase.from('blocked_domains').delete().neq('id', 0)
    await supabase.from('blocked_domains_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { data: batch, error: batchError } = await supabase
      .from('blocked_domains_batches')
      .insert({
        label: 'Mock seed data',
        source_file: 'mock',
        row_count: mockBlockedDomains.length,
        is_active: true,
      })
      .select('id')
      .single()

    if (batchError || !batch) {
      console.error('  ❌ Error creating batch:', batchError?.message)
      return
    }

    const chunk = mockBlockedDomains.map((d) => ({ ...d, batch_id: batch.id }))
    const { error } = await supabase.from('blocked_domains').insert(chunk)
    if (error) {
      console.error('  ❌ Error inserting mock domains:', error.message)
    } else {
      console.log(`  ✅ ${mockBlockedDomains.length} mock blocked domains seeded`)
    }
    return
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvText.trim().split('\n')
  const headers = lines[0].split(',').map((h: string) => h.trim())

  const rows = lines.slice(1).map((line: string) => {
    const vals = line.split(',')
    const row: Record<string, string> = {}
    headers.forEach((h: string, i: number) => {
      row[h] = vals[i]?.trim() || 'ok'
    })
    return row
  })

  await supabase.from('blocked_domains').delete().neq('id', 0)
  await supabase.from('blocked_domains_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data: batch, error: batchError } = await supabase
    .from('blocked_domains_batches')
    .insert({
      label: 'Initial seed data',
      source_file: 'blocking-data.csv',
      row_count: rows.length,
      is_active: true,
    })
    .select('id')
    .single()

  if (batchError || !batch) {
    console.error('  ❌ Error creating batch:', batchError?.message)
    return
  }

  const CHUNK_SIZE = 50
  let inserted = 0

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE).map((r: Record<string, string>) => ({
      batch_id: batch.id,
      site: r.site,
      domain: r.domain,
      category: r.category,
      cantv: r.CANTV || 'ok',
      movistar: r.Movistar || 'ok',
      digitel: r.Digitel || 'ok',
      inter: r.Inter || 'ok',
      netuno: r.Netuno || 'ok',
      airtek: r.Airtek || 'ok',
      g_network: r['G-Network'] || 'ok',
    }))

    const { error } = await supabase.from('blocked_domains').insert(chunk)
    if (error) {
      console.error(`  ❌ Chunk error at ${i}:`, error.message)
    } else {
      inserted += chunk.length
    }
  }

  console.log(`  ✅ ${inserted}/${rows.length} blocked domains seeded`)
}

async function seedGaceta(supabase: any) {
  console.log('📜 Seeding Gaceta Oficial records...')

  const fs = await import('fs')
  const path = await import('path')

  const csvPath = path.join(process.cwd(), 'others', 'new_features', 'gacetadashboard', 'cambios_gobierno_2026.csv')
  if (!fs.existsSync(csvPath)) {
    console.warn('  ⚠️  cambios_gobierno_2026.csv not found — using mock data instead')

    const { data: batch, error: batchError } = await supabase
      .from('gazette_batches')
      .insert({ label: 'Mock seed data', source_file: 'mock', row_count: mockGacetaRecords.length, is_active: true })
      .select('id')
      .single()

    if (batchError || !batch) {
      console.error('  ❌ Error creating batch:', batchError?.message)
      return
    }

    const rows = mockGacetaRecords.map((r) => ({ ...r, id: undefined, batch_id: batch.id }))
    const { error } = await supabase.from('gazette_records').insert(rows)
    if (error) {
      console.error('  ❌ Error inserting mock records:', error.message)
    } else {
      console.log(`  ✅ ${rows.length} mock gazette records seeded`)
    }
    return
  }

  // RFC 4180 CSV parser — handles quoted fields with embedded commas
  function parseCSV(text: string): Record<string, string>[] {
    // Strip UTF-8 BOM
    const cleaned = text.replace(/^\uFEFF/, '')
    const lines: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i]
      if (ch === '"') {
        if (inQuotes && cleaned[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === '\n' && !inQuotes) {
        lines.push(current)
        current = ''
      } else if (ch === '\r' && !inQuotes) {
        // skip CR
      } else {
        current += ch
      }
    }
    if (current) lines.push(current)

    if (lines.length < 2) return []

    function splitLine(line: string): string[] {
      const fields: string[] = []
      let field = ''
      let inQ = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') {
            field += '"'
            i++
          } else {
            inQ = !inQ
          }
        } else if (ch === ',' && !inQ) {
          fields.push(field)
          field = ''
        } else {
          field += ch
        }
      }
      fields.push(field)
      return fields
    }

    const headers = splitLine(lines[0])
    return lines.slice(1).filter((l) => l.trim()).map((line) => {
      const vals = splitLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h.trim()] = vals[i]?.trim() ?? '' })
      return row
    })
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(csvText)

  // Create batch
  const { data: batch, error: batchError } = await supabase
    .from('gazette_batches')
    .insert({
      label: 'Enero–Marzo 2026',
      source_file: 'cambios_gobierno_2026.csv',
      row_count: rows.length,
      is_active: true,
    })
    .select('id')
    .single()

  if (batchError || !batch) {
    console.error('  ❌ Error creating gazette batch:', batchError?.message)
    return
  }

  const CHUNK_SIZE = 100
  let inserted = 0

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE).map((r) => ({
      batch_id: batch.id,
      gazette_number: parseInt(r.gazette_number) || 0,
      gazette_type: r.gazette_type || 'Ordinaria',
      gazette_date: r.gazette_date,
      decree_number: r.decree_number || null,
      change_type: r.change_type,
      change_label: getLabelForChangeType(r.change_type),
      person_name: r.person_name || null,
      post_or_position: r.post_or_position || null,
      institution: r.institution || null,
      organism: r.organism || null,
      is_military_person: r.is_military_person?.toUpperCase() === 'SI',
      military_rank: r.military_rank || null,
      is_military_post: r.is_military_post?.toUpperCase() === 'SI',
      summary: r.summary || null,
    }))

    const { error } = await supabase.from('gazette_records').insert(chunk)
    if (error) {
      console.error(`  ❌ Chunk error at ${i}:`, error.message)
    } else {
      inserted += chunk.length
    }
  }

  console.log(`  ✅ ${inserted}/${rows.length} gazette records seeded`)
}

seed().catch(console.error)
