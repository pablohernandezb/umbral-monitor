import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { VENEZUELA_STATES } from '@/data/venezuela-states'
import type { RegionSignalData, StateOutageScore, OutageSeverity } from '@/types/ioda'

// Up to 60 s — needed to fetch 25 × 3 datasources + outage scores in parallel batches
export const maxDuration = 60

const IODA_BASE = 'https://api.ioda.inetintel.cc.gatech.edu/v2'
const MAX_CONCURRENT = 5
const DATASOURCES = ['bgp', 'ping-slash24', 'merit-nt'] as const

// ── Service-role Supabase client ───────────────────────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── IODA fetch helpers ─────────────────────────────────────────────────────

async function fetchRegionSignals(
  iodaCode: string,
  datasource: string,
  from: number,
  until: number
): Promise<{ from: number; step: number; values: (number | null)[] } | null> {
  const url =
    `${IODA_BASE}/signals/raw/region/${iodaCode}` +
    `?from=${from}&until=${until}&datasource=${encodeURIComponent(datasource)}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return null
    const json = await res.json() as { data?: unknown[][] }
    const signals = Array.isArray(json?.data) ? json.data.flat() : []
    const signal = signals.find(
      (s: unknown) =>
        typeof s === 'object' && s !== null &&
        (s as Record<string, unknown>).datasource === datasource
    ) as { from?: number; step?: number; values?: (number | null)[] } | undefined
    return signal?.values ? { from: signal.from ?? from, step: signal.step ?? 300, values: signal.values } : null
  } catch {
    return null
  }
}

async function fetchOutageScore(
  iodaCode: string,
  from: number,
  until: number
): Promise<number> {
  const url =
    `${IODA_BASE}/outages/summary` +
    `?entityType=region&entityCode=${iodaCode}&from=${from}&until=${until}`
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) return 0
    const json = await res.json() as { data?: Array<{ scores?: { overall?: number } }> }
    return json.data?.[0]?.scores?.overall ?? 0
  } catch {
    return 0
  }
}

// ── Concurrency limiter ────────────────────────────────────────────────────

async function runWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let idx = 0
  let running = 0

  await new Promise<void>((resolve) => {
    function next() {
      if (idx >= items.length && running === 0) { resolve(); return }
      while (running < limit && idx < items.length) {
        const i = idx++
        running++
        fn(items[i]).then((r) => { results[i] = r }).finally(() => { running--; next() })
      }
    }
    next()
  })

  return results
}

// ── Severity classifier (mirrors /api/ioda/outages) ───────────────────────

function classifySeverity(score: number): OutageSeverity {
  if (score <= 0)      return 'normal'
  if (score < 1000)    return 'low'
  if (score < 50000)   return 'degraded'
  if (score < 200000)  return 'high'
  return 'critical'
}

// ── Handlers ───────────────────────────────────────────────────────────────

/** Cron: fetch all 25 regions × 3 datasources + outage scores, upsert to DB */
async function handleSync() {
  const db = getServiceClient()
  if (!db) return NextResponse.json({ error: 'No service client' }, { status: 500 })

  const now = Math.floor(Date.now() / 1000)
  const from = now - 25 * 3600 // 25h window for a complete 24h picture

  // Fetch all datasources + outage scores in parallel
  const [bgpResults, probingResults, telescopeResults, outageScores] = await Promise.all([
    runWithConcurrency(VENEZUELA_STATES, (s) => fetchRegionSignals(s.iodaCode, 'bgp', from, now), MAX_CONCURRENT),
    runWithConcurrency(VENEZUELA_STATES, (s) => fetchRegionSignals(s.iodaCode, 'ping-slash24', from, now), MAX_CONCURRENT),
    runWithConcurrency(VENEZUELA_STATES, (s) => fetchRegionSignals(s.iodaCode, 'merit-nt', from, now), MAX_CONCURRENT),
    runWithConcurrency(VENEZUELA_STATES, (s) => fetchOutageScore(s.iodaCode, from, now), MAX_CONCURRENT),
  ])

  const fetchedAt = new Date().toISOString()
  const signalRows: object[] = []
  const outageRows: object[] = []

  VENEZUELA_STATES.forEach((state, i) => {
    const dsResults = [bgpResults[i], probingResults[i], telescopeResults[i]]

    DATASOURCES.forEach((ds, dsIdx) => {
      const sig = dsResults[dsIdx]
      signalRows.push({
        region_code:  state.code,
        region_name:  state.name,
        datasource:   ds,
        from_epoch:   sig?.from ?? from,
        step_seconds: sig?.step ?? 300,
        values:       sig?.values ?? [],
        fetched_at:   fetchedAt,
      })
    })

    const score = outageScores[i]
    outageRows.push({
      region_code: state.code,
      region_name: state.name,
      score,
      severity:    classifySeverity(score),
      fetched_at:  fetchedAt,
    })
  })

  const [sigRes, outRes] = await Promise.all([
    db.from('ioda_region_signals').upsert(signalRows, { onConflict: 'region_code,datasource' }),
    db.from('ioda_region_outages').upsert(outageRows, { onConflict: 'region_code' }),
  ])

  return NextResponse.json({
    ok: !sigRes.error && !outRes.error,
    signalRows: signalRows.length,
    outageRows: outageRows.length,
    errors: [sigRes.error?.message, outRes.error?.message].filter(Boolean),
    syncedAt: fetchedAt,
  })
}

/** Read: serve stored region signals or outage scores from DB */
async function handleRead(datasource: string | null, outages: boolean) {
  const { supabase: anonDb } = await import('@/lib/supabase')
  const db = getServiceClient() ?? anonDb
  if (!db) return NextResponse.json({ error: 'No DB client' }, { status: 500 })

  if (outages) {
    const { data, error } = await db
      .from('ioda_region_outages')
      .select('region_code,region_name,score,severity,fetched_at')
      .order('score', { ascending: false })

    const scores: StateOutageScore[] = (data ?? []).map((r) => ({
      regionCode: r.region_code,
      regionName: r.region_name,
      score:      r.score,
      severity:   r.severity as OutageSeverity,
    }))

    return NextResponse.json({
      scores,
      fetchedAt: data?.[0]?.fetched_at ?? new Date().toISOString(),
      error: error?.message ?? null,
    }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } })
  }

  // Signal read — must specify datasource
  const ds = datasource ?? 'bgp'
  const { data, error } = await db
    .from('ioda_region_signals')
    .select('region_code,region_name,datasource,from_epoch,step_seconds,values,fetched_at')
    .eq('datasource', ds)

  const regions: RegionSignalData[] = (data ?? []).map((r) => ({
    regionCode: r.region_code,
    regionName: r.region_name,
    datasource: r.datasource,
    from:       r.from_epoch,
    step:       r.step_seconds,
    values:     r.values as (number | null)[],
  }))

  return NextResponse.json({
    datasource: ds,
    regions,
    fetchedAt: data?.[0]?.fetched_at ?? new Date().toISOString(),
    error: error?.message ?? null,
  }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } })
}

// ── Route entry point ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const secret = searchParams.get('secret')
  const force  = searchParams.get('force') === 'true'

  const cronSecret = process.env.CRON_SECRET
  if (force && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (force) return await handleSync()

    const datasource = searchParams.get('datasource')
    const outages    = searchParams.get('outages') === 'true'
    return await handleRead(datasource, outages)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
