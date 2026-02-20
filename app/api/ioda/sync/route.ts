import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hoursAgo, nowEpoch, formatEpoch } from '@/lib/ioda'
import type { IODASignal, IODAOutageEvent, NormalizedSignalPoint } from '@/types/ioda'

// Allow up to 5 minutes for backfill operations spanning multiple chunks
export const maxDuration = 300

const IODA_BASE = 'https://api.ioda.inetintel.cc.gatech.edu/v2'

// Jan 1, 2026 00:00:00 UTC — earliest historical data to backfill
const BACKFILL_START = 1767225600

// Chunk size for backfill to stay within IODA's preferred window sizes
const CHUNK_SECONDS = 7 * 24 * 3600 // 7 days

// ── Service-role Supabase client (write access) ────────────────────────────
// Never expose the service role key to the client
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── IODA direct fetch (server-side only) ───────────────────────────────────

async function fetchIodaSignals(
  entityType: string,
  entityCode: string,
  from: number,
  until: number
): Promise<IODASignal[]> {
  const url = `${IODA_BASE}/signals/raw/${entityType}/${entityCode}?from=${from}&until=${until}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    // IODA v2 returns { data: [[sig1, sig2, ...]] } — one outer array wrapping per-entity arrays
    const json = await res.json() as { data?: unknown[][] }
    return Array.isArray(json?.data) ? (json.data as unknown[][]).flat() as IODASignal[] : []
  } catch {
    return []
  }
}

async function fetchIodaEvents(
  entityType: string,
  entityCode: string,
  from: number,
  until: number
): Promise<IODAOutageEvent[]> {
  // Correct IODA v2 path: /outages/events with query params (not path params)
  const url = `${IODA_BASE}/outages/events?entityType=${entityType}&entityCode=${entityCode}&from=${from}&until=${until}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    // IODA v2 outages/events returns { data: [...events] } — flat array
    const json = await res.json() as { data?: unknown }
    return Array.isArray(json?.data) ? (json.data as IODAOutageEvent[]) : []
  } catch {
    return []
  }
}

// ── DB row → NormalizedSignalPoint ─────────────────────────────────────────

interface SignalRow {
  entity_type: string
  entity_code: string
  timestamp: number
  bgp: number | null
  probing: number | null
  telescope: number | null
}

interface EventRow {
  entity_type: string
  entity_code: string
  datasource: string
  start: number
  duration: number
  score: number
}

function rowToSignalPoint(row: SignalRow): NormalizedSignalPoint {
  return {
    time: formatEpoch(row.timestamp, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    timestamp: row.timestamp,
    bgp: row.bgp,
    probing: row.probing,
    telescope: row.telescope,
  }
}

// ── Upsert a chunk of signals + events ────────────────────────────────────

async function upsertChunk(
  entityType: string,
  entityCode: string,
  from: number,
  until: number
): Promise<{ signalRows: number; eventRows: number; error: string | null }> {
  const db = getServiceClient()
  if (!db) return { signalRows: 0, eventRows: 0, error: 'No service client' }

  const [signals, events] = await Promise.all([
    fetchIodaSignals(entityType, entityCode, from, until),
    fetchIodaEvents(entityType, entityCode, from, until),
  ])

  const now = new Date().toISOString()

  // Build signal rows — one row per time step per datasource merged into one row
  // First group by timestamp
  const signalByTs = new Map<number, SignalRow>()

  for (const signal of signals) {
    for (let i = 0; i < signal.values.length; i++) {
      const ts = signal.from + i * signal.step
      const value = signal.values[i]
      if (value === null) continue

      const existing = signalByTs.get(ts) ?? {
        entity_type: entityType,
        entity_code: entityCode,
        timestamp: ts,
        bgp: null,
        probing: null,
        telescope: null,
      }

      if (signal.datasource === 'bgp')          existing.bgp       = value
      if (signal.datasource === 'ping-slash24') existing.probing   = value
      // 'ucsd-nt' (UCSD telescope) was replaced by 'merit-nt' in IODA v2
      if (signal.datasource === 'ucsd-nt' || signal.datasource === 'merit-nt') existing.telescope = value

      signalByTs.set(ts, existing)
    }
  }

  const signalRows = Array.from(signalByTs.values()).map(r => ({ ...r, updated_at: now }))
  const eventRows: (EventRow & { updated_at: string })[] = events.map(e => ({
    entity_type: entityType,
    entity_code: entityCode,
    datasource: e.datasource,
    start: e.start,
    duration: e.duration,
    score: e.score,
    updated_at: now,
  }))

  const errors: string[] = []

  if (signalRows.length > 0) {
    const { error } = await db
      .from('ioda_signals')
      .upsert(signalRows, { onConflict: 'entity_type,entity_code,timestamp' })
    if (error) errors.push(`signals: ${error.message}`)
  }

  if (eventRows.length > 0) {
    const { error } = await db
      .from('ioda_events')
      .upsert(eventRows, { onConflict: 'entity_type,entity_code,datasource,start' })
    if (error) errors.push(`events: ${error.message}`)
  }

  return {
    signalRows: signalRows.length,
    eventRows: eventRows.length,
    error: errors.length > 0 ? errors.join('; ') : null,
  }
}

// ── Handlers ───────────────────────────────────────────────────────────────

/** Cron: fetch latest 24h for VE and upsert */
async function handleSync(entityType = 'country', entityCode = 'VE') {
  const result = await upsertChunk(entityType, entityCode, hoursAgo(25), nowEpoch())
  return NextResponse.json({
    ok: !result.error,
    ...result,
    syncedAt: new Date().toISOString(),
  })
}

/** Backfill: process BACKFILL_START → now in CHUNK_SECONDS windows */
async function handleBackfill(
  entityType: string,
  entityCode: string,
  fromOverride?: number
) {
  const from = fromOverride ?? BACKFILL_START
  const until = nowEpoch()

  const chunks: { from: number; until: number }[] = []
  let cursor = from
  while (cursor < until) {
    const end = Math.min(cursor + CHUNK_SECONDS, until)
    chunks.push({ from: cursor, until: end })
    cursor = end
  }

  let totalSignals = 0
  let totalEvents = 0
  const chunkErrors: string[] = []

  for (const chunk of chunks) {
    const result = await upsertChunk(entityType, entityCode, chunk.from, chunk.until)
    totalSignals += result.signalRows
    totalEvents += result.eventRows
    if (result.error) chunkErrors.push(`[${chunk.from}–${chunk.until}] ${result.error}`)
    // Brief pause to respect IODA rate limits between chunks
    await new Promise(r => setTimeout(r, 400))
  }

  return NextResponse.json({
    ok: chunkErrors.length === 0,
    chunks: chunks.length,
    totalSignals,
    totalEvents,
    errors: chunkErrors,
    completedAt: new Date().toISOString(),
  })
}

/** Read: serve stored signals + events from Supabase for the dashboard */
async function handleRead(
  entityType: string,
  entityCode: string,
  from: number,
  until: number
) {
  const db = getServiceClient()

  // Fall back to anon client if service key not configured
  const { supabase: anonDb } = await import('@/lib/supabase')
  const client = db ?? anonDb
  if (!client) {
    return NextResponse.json({ signals: [], events: [], error: 'No DB client' })
  }

  const [signalRes, eventRes] = await Promise.all([
    client
      .from('ioda_signals')
      .select('entity_type,entity_code,timestamp,bgp,probing,telescope')
      .eq('entity_type', entityType)
      .eq('entity_code', entityCode)
      .gte('timestamp', from)
      .lte('timestamp', until)
      .order('timestamp', { ascending: true }),

    client
      .from('ioda_events')
      .select('datasource,start,duration,score')
      .eq('entity_type', entityType)
      .eq('entity_code', entityCode)
      .gte('start', from)
      .lte('start', until)
      .order('start', { ascending: false }),
  ])

  const signals: NormalizedSignalPoint[] = ((signalRes.data as SignalRow[]) ?? []).map(rowToSignalPoint)

  const events: IODAOutageEvent[] = ((eventRes.data as EventRow[]) ?? []).map(r => ({
    datasource: r.datasource,
    start: r.start,
    duration: r.duration,
    score: r.score,
  }))

  return NextResponse.json({
    signals,
    events,
    fetchedAt: new Date().toISOString(),
    error: signalRes.error?.message ?? eventRes.error?.message ?? null,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  })
}

// ── Route entry point ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const secret = searchParams.get('secret')
  const force = searchParams.get('force') === 'true'
  const backfill = searchParams.get('backfill') === 'true'
  const entityType = searchParams.get('entity_type') ?? 'country'
  const entityCode = searchParams.get('entity_code') ?? 'VE'

  // Protect write operations with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  if ((force || backfill) && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (backfill) {
      const fromParam = searchParams.get('from')
      const fromTs = fromParam ? parseInt(fromParam, 10) : undefined
      return await handleBackfill(entityType, entityCode, fromTs)
    }

    if (force) {
      return await handleSync(entityType, entityCode)
    }

    // Default: serve stored data
    const from = parseInt(searchParams.get('from') ?? String(hoursAgo(24)), 10)
    const until = parseInt(searchParams.get('until') ?? String(nowEpoch()), 10)
    return await handleRead(entityType, entityCode, from, until)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
