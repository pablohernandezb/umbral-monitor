import { NextResponse } from 'next/server'
import { supabase, IS_MOCK_MODE } from '@/lib/supabase'
import type { GdeltDataPoint, GdeltApiResponse } from '@/types/gdelt'

// GDELT DOC API v2 (the v1 Stability Timeline API is down)
const GDELT_DOC_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc'
const TIMESPAN = '120d'

// Conflict volume as instability proxy
const INSTABILITY_URL = `${GDELT_DOC_BASE}?query=venezuela+(protest+OR+conflict+OR+crisis+OR+violence+OR+unrest)&mode=timelinevol&timespan=${TIMESPAN}&format=csv`
// Overall media tone
const TONE_URL = `${GDELT_DOC_BASE}?query=venezuela&mode=timelinetone&timespan=${TIMESPAN}&format=csv`
// Overall article volume (attention)
const ARTVOLNORM_URL = `${GDELT_DOC_BASE}?query=venezuela&mode=timelinevol&timespan=${TIMESPAN}&format=csv`

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24h between GDELT fetches

// In-memory cache for mock mode only
let mockCache: GdeltApiResponse | null = null
let mockCacheTimestamp = 0

// ── CSV Parser ────────────────────────────────────────────────
// GDELT DOC API v2 CSV format: "Date,Series,Value" (3 columns, BOM prefix)
function parseCsv(csvText: string): Map<string, number> {
  const map = new Map<string, number>()
  const clean = csvText.replace(/^\uFEFF/, '').trim()
  const lines = clean.split('\n')
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split(',')
    const date = parts[0]?.trim()
    const value = parseFloat(parts[parts.length - 1]?.trim())
    if (date && !isNaN(value)) {
      map.set(date, value)
    }
  }
  return map
}

// ── Sequential GDELT fetcher ──────────────────────────────────
async function fetchWithDelay(url: string, delayMs: number): Promise<Response> {
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return fetch(url)
}

async function fetchGdeltSignals() {
  let instMap = new Map<string, number>()
  let toneMap = new Map<string, number>()
  let artMap = new Map<string, number>()

  try {
    const res = await fetchWithDelay(INSTABILITY_URL, 0)
    if (res.ok) {
      const text = await res.text()
      if (!text.includes('<!')) instMap = parseCsv(text)
    }
  } catch { /* continue */ }

  try {
    const res = await fetchWithDelay(TONE_URL, 10000)
    if (res.ok) {
      const text = await res.text()
      if (!text.includes('<!')) toneMap = parseCsv(text)
    }
  } catch { /* continue */ }

  try {
    const res = await fetchWithDelay(ARTVOLNORM_URL, 10000)
    if (res.ok) {
      const text = await res.text()
      if (!text.includes('<!')) artMap = parseCsv(text)
    }
  } catch { /* continue */ }

  return { instMap, toneMap, artMap }
}

// ── DB row type (includes updated_at) ─────────────────────────
interface GdeltDbRow {
  date: string
  instability: number | null
  tone: number | null
  artvolnorm: number | null
  updated_at: string
}

// ── Supabase mode: persistent DB archive ──────────────────────
async function handleSupabaseMode(): Promise<NextResponse> {
  const db = supabase!

  // 1. Read existing data from DB
  const { data: dbRows, error: dbError } = await db
    .from('gdelt_data')
    .select('*')
    .order('date', { ascending: true })

  const existing = (dbRows || []) as GdeltDbRow[]

  // 2. Check if we need to refresh from GDELT
  const latestUpdate = existing.length > 0
    ? Math.max(...existing.map(r => new Date(r.updated_at).getTime()))
    : 0
  const needsRefresh = Date.now() - latestUpdate > REFRESH_INTERVAL_MS || existing.length === 0

  if (!needsRefresh && !dbError) {
    // Return DB data as-is
    const data: GdeltDataPoint[] = existing.map(({ date, instability, tone, artvolnorm }) => ({
      date, instability, tone, artvolnorm,
    }))
    return NextResponse.json({
      data,
      fetchedAt: new Date(latestUpdate).toISOString(),
      error: null,
    } satisfies GdeltApiResponse, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  }

  // 3. Fetch fresh data from GDELT
  const { instMap, toneMap, artMap } = await fetchGdeltSignals()
  const allFailed = instMap.size === 0 && toneMap.size === 0 && artMap.size === 0

  // If all GDELT requests failed, return existing DB data
  if (allFailed && existing.length > 0) {
    const data: GdeltDataPoint[] = existing.map(({ date, instability, tone, artvolnorm }) => ({
      date, instability, tone, artvolnorm,
    }))
    return NextResponse.json({
      data,
      fetchedAt: new Date(latestUpdate).toISOString(),
      error: 'GDELT endpoints unavailable, serving archived data',
    } satisfies GdeltApiResponse, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600' },
    })
  }

  // 4. Merge GDELT data with existing DB data (preserve non-null DB values)
  const existingMap = new Map(existing.map(r => [r.date, r]))
  const allDates = new Set([
    ...instMap.keys(),
    ...toneMap.keys(),
    ...artMap.keys(),
    ...existingMap.keys(),
  ])

  const now = new Date().toISOString()
  const merged = Array.from(allDates).sort().map(date => {
    const prev = existingMap.get(date)
    return {
      date,
      instability: instMap.get(date) ?? prev?.instability ?? null,
      tone: toneMap.get(date) ?? prev?.tone ?? null,
      artvolnorm: artMap.get(date) ?? prev?.artvolnorm ?? null,
      updated_at: now,
    }
  })

  // 5. Upsert to DB (batch)
  if (merged.length > 0) {
    await db
      .from('gdelt_data')
      .upsert(merged, { onConflict: 'date' })
  }

  // 6. Return merged data
  const responseData: GdeltDataPoint[] = merged.map(({ date, instability, tone, artvolnorm }) => ({
    date, instability, tone, artvolnorm,
  }))

  return NextResponse.json({
    data: responseData,
    fetchedAt: now,
    error: null,
  } satisfies GdeltApiResponse, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}

// ── Mock mode: in-memory cache + mock data fallback ───────────
async function handleMockMode(): Promise<NextResponse> {
  // Return cached if fresh
  if (mockCache && Date.now() - mockCacheTimestamp < REFRESH_INTERVAL_MS) {
    return NextResponse.json(mockCache, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  }

  const { instMap, toneMap, artMap } = await fetchGdeltSignals()
  const allFailed = instMap.size === 0 && toneMap.size === 0 && artMap.size === 0

  if (allFailed) {
    // Return stale cache or empty
    if (mockCache) {
      return NextResponse.json(
        { ...mockCache, error: 'GDELT fetch failed, serving cached data' },
        { headers: { 'Cache-Control': 'public, s-maxage=1800' } }
      )
    }
    return NextResponse.json(
      { data: [], fetchedAt: new Date().toISOString(), error: 'All GDELT endpoints unavailable' },
      { status: 502 }
    )
  }

  const allDates = new Set([...instMap.keys(), ...toneMap.keys(), ...artMap.keys()])
  const merged: GdeltDataPoint[] = Array.from(allDates).sort().map(date => ({
    date,
    instability: instMap.get(date) ?? null,
    tone: toneMap.get(date) ?? null,
    artvolnorm: artMap.get(date) ?? null,
  }))

  const response: GdeltApiResponse = {
    data: merged,
    fetchedAt: new Date().toISOString(),
    error: null,
  }

  mockCache = response
  mockCacheTimestamp = Date.now()

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}

// ── Main handler ──────────────────────────────────────────────
export async function GET() {
  try {
    if (IS_MOCK_MODE || !supabase) {
      return await handleMockMode()
    }
    return await handleSupabaseMode()
  } catch (err) {
    return NextResponse.json(
      { data: [], fetchedAt: new Date().toISOString(), error: String(err) },
      { status: 502 }
    )
  }
}
