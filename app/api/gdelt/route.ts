import { NextResponse } from 'next/server'
import { supabase, IS_MOCK_MODE } from '@/lib/supabase'
import type { GdeltDataPoint, GdeltApiResponse, GdeltSignalKey } from '@/types/gdelt'

// Timing budget. GDELT answers in 14–17s per call, so:
//   • default rotating run (1 signal)  ≈ 15–25s, up to ~40s if a retry fires
//   • ?all=true backfill (3 signals)   ≈ 55–65s
//
// If the platform ever kills the handler mid-run, that is safe: the upsert
// happens only after the fetches resolve, so a truncated run writes nothing
// rather than half-stale rows.
export const maxDuration = 60

// GDELT DOC API v2 (the v1 Stability Timeline API is down)
const GDELT_DOC_BASE = 'https://api.gdeltproject.org/api/v2/doc/doc'
const TIMESPAN = '120d'

// Conflict volume as instability proxy
const INSTABILITY_URL = `${GDELT_DOC_BASE}?query=venezuela+(protest+OR+conflict+OR+crisis+OR+violence+OR+unrest)&mode=timelinevol&timespan=${TIMESPAN}&format=csv`
// Overall media tone
const TONE_URL = `${GDELT_DOC_BASE}?query=venezuela&mode=timelinetone&timespan=${TIMESPAN}&format=csv`
// Overall article volume (attention)
const ARTVOLNORM_URL = `${GDELT_DOC_BASE}?query=venezuela&mode=timelinevol&timespan=${TIMESPAN}&format=csv`

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

// ── Sequential, rate-limited GDELT fetcher ────────────────────
// GDELT DOC 2.0 enforces "one request every 5 seconds" and answers violations
// with HTTP 429 and a plaintext warning body. Issuing the three signals through
// Promise.all tripped that limit on every run: typically the first request was
// served and the other two were rejected, which is why the signals drifted to
// different end dates instead of all stopping together.
//
// So the requests must be serialized and spaced. Measured latency is 14–17s per
// successful call, so a full pass costs roughly 55–65s. That does not fit in
// Vercel Hobby's 10s ceiling — see the maxDuration note above.
const FETCH_TIMEOUT_MS = 25_000
const RATE_LIMIT_GAP_MS = 5_500
// The documented limit is one request per 5s, but the limiter is stricter once
// tripped — an isolated request can still 429 for a while afterwards. Back off
// well past the stated window before the single retry.
const RETRY_BACKOFF_MS = 15_000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface FetchOutcome {
  map: Map<string, number>
  ok: boolean
  reason: string | null
}

async function safeGdeltFetch(url: string, label: string): Promise<FetchOutcome> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    const text = await res.text()

    // GDELT signals rate limiting with 429 plus a plaintext advisory body.
    if (res.status === 429) {
      return { map: new Map(), ok: false, reason: `${label}: rate limited (429)` }
    }
    if (!res.ok) {
      return { map: new Map(), ok: false, reason: `${label}: HTTP ${res.status}` }
    }
    // GDELT returns an HTML error page instead of a status code on some faults.
    if (text.includes('<!')) {
      return { map: new Map(), ok: false, reason: `${label}: HTML error page` }
    }

    const map = parseCsv(text)
    if (map.size === 0) {
      // A 200 carrying no parseable rows is a failure, not "no news".
      return { map, ok: false, reason: `${label}: no parseable rows` }
    }
    return { map, ok: true, reason: null }
  } catch (err) {
    return { map: new Map(), ok: false, reason: `${label}: ${describeError(err)}` }
  }
}

/**
 * undici collapses every network-level failure into `TypeError: fetch failed`
 * and hides the actual cause (ECONNRESET, socket hang up, DNS) on `err.cause`.
 * Unwrap it — without this, a connection reset and a DNS outage are
 * indistinguishable in the logs.
 */
function describeError(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  if (err.name === 'TimeoutError') return `timeout after ${FETCH_TIMEOUT_MS}ms`

  const cause = (err as { cause?: unknown }).cause
  if (cause instanceof Error) {
    const code = (cause as { code?: string }).code
    return `${err.message} (${code ? `${code}: ` : ''}${cause.message})`
  }
  return err.message
}

const SIGNAL_SPECS = [
  { key: 'instability', url: INSTABILITY_URL },
  { key: 'tone', url: TONE_URL },
  { key: 'artvolnorm', url: ARTVOLNORM_URL },
] as const

/**
 * Which signal a rotating run should refresh, derived from the UTC day number
 * so consecutive daily crons cycle through all three.
 */
function signalForToday(): (typeof SIGNAL_SPECS)[number] {
  const dayNumber = Math.floor(Date.now() / 86_400_000)
  return SIGNAL_SPECS[dayNumber % SIGNAL_SPECS.length]
}

/**
 * One attempt plus a single backoff retry. Retries cover both rate limiting and
 * transient network faults — when GDELT throttles hard it stops returning 429
 * and drops the connection instead, which surfaces as `fetch failed`. Only
 * genuine HTTP error statuses (4xx/5xx other than 429) are treated as final.
 */
async function fetchWithRetry(url: string, label: string): Promise<FetchOutcome> {
  const first = await safeGdeltFetch(url, label)
  if (first.ok) return first

  const retryable =
    first.reason?.includes('429') ||
    first.reason?.includes('fetch failed') ||
    first.reason?.includes('timeout')
  if (!retryable) return first

  await sleep(RETRY_BACKOFF_MS)
  const second = await safeGdeltFetch(url, label)
  return second.ok
    ? second
    : { ...second, reason: `${second.reason} (after retry)` }
}

/**
 * Fetch signals from GDELT.
 *
 * `mode: 'rotate'` (the cron default) refreshes a single signal per run. Each
 * request already returns a full 120-day window, so one signal every three days
 * still yields complete daily coverage — while issuing a third as many requests,
 * which is what keeps us under GDELT's rate limiter. `mode: 'all'` fetches all
 * three serialized, for manual backfills where the extra ~45s is acceptable.
 */
async function fetchGdeltSignals(mode: 'rotate' | 'all') {
  const specs = mode === 'all' ? [...SIGNAL_SPECS] : [signalForToday()]
  const outcomes: Partial<Record<string, FetchOutcome>> = {}

  for (let i = 0; i < specs.length; i++) {
    if (i > 0) await sleep(RATE_LIMIT_GAP_MS)
    outcomes[specs[i].key] = await fetchWithRetry(specs[i].url, specs[i].key)
  }

  const attempted = specs.map(s => outcomes[s.key]!)
  const failures = attempted
    .filter(r => !r.ok)
    .map(r => r.reason)
    .filter((r): r is string => r !== null)

  // Signals not attempted this run yield empty maps, so the merge below falls
  // back to their stored values rather than overwriting them.
  const empty = new Map<string, number>()

  return {
    instMap: outcomes.instability?.map ?? empty,
    toneMap: outcomes.tone?.map ?? empty,
    artMap: outcomes.artvolnorm?.map ?? empty,
    failures,
    allFailed: attempted.every(r => !r.ok),
    attempted: specs.map(s => s.key),
  }
}

// ── DB row type (includes updated_at) ─────────────────────────
interface GdeltDbRow {
  date: string
  instability: number | null
  tone: number | null
  artvolnorm: number | null
  updated_at: string
}

const SIGNAL_KEYS: GdeltSignalKey[] = ['instability', 'tone', 'artvolnorm']

/** Whole days between a "YYYY-MM-DD" date and today, in UTC. */
function daysSince(date: string): number {
  const then = Date.parse(`${date}T00:00:00Z`)
  if (Number.isNaN(then)) return 0
  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return Math.max(0, Math.floor((todayUtc - then) / 86_400_000))
}

/**
 * Derive freshness metadata from the rows being served. Computed on every
 * response path — including cache hits — so the client can never be told the
 * feed is live when the newest row is months old.
 *
 * `stalenessDays` deliberately reports the WORST signal, not the newest one.
 * Signals fail independently here, so a run that refreshes only `tone` leaves
 * the chart two-thirds frozen; measuring from the newest date would report
 * that as perfectly fresh, which is the exact failure this is meant to catch.
 */
function buildFreshness(points: GdeltDataPoint[]) {
  const signalLastDates = Object.fromEntries(
    SIGNAL_KEYS.map(key => {
      let last: string | null = null
      for (const p of points) {
        if (p[key] !== null && (last === null || p.date > last)) last = p.date
      }
      return [key, last]
    })
  ) as Record<GdeltSignalKey, string | null>

  const dated = SIGNAL_KEYS
    .map(k => signalLastDates[k])
    .filter((d): d is string => d !== null)

  // Newest date across all signals — what the chart actually extends to.
  const latestDataDate = dated.reduce<string | null>(
    (max, d) => (max === null || d > max ? d : max),
    null
  )

  // Signals carrying no data at all; stale by definition, and invisible to a
  // date comparison because they have no date to compare.
  const missingSignals = SIGNAL_KEYS.filter(k => signalLastDates[k] === null)

  // Oldest of the per-signal end dates drives the staleness verdict.
  const stalestDate = dated.reduce<string | null>(
    (min, d) => (min === null || d < min ? d : min),
    null
  )
  const stalestSignal =
    SIGNAL_KEYS.find(k => signalLastDates[k] === stalestDate) ?? null

  return {
    latestDataDate,
    stalenessDays: stalestDate ? daysSince(stalestDate) : null,
    stalestSignal: missingSignals[0] ?? stalestSignal,
    missingSignals,
    signalLastDates,
  }
}

const toPoints = (rows: GdeltDbRow[]): GdeltDataPoint[] =>
  rows.map(({ date, instability, tone, artvolnorm }) => ({ date, instability, tone, artvolnorm }))

/** Newest `updated_at` across rows — i.e. when the archive last actually changed. */
function lastWriteIso(rows: GdeltDbRow[], fallback: string): string {
  const stamps = rows
    .map(r => new Date(r.updated_at).getTime())
    .filter(t => !Number.isNaN(t))
  return stamps.length > 0 ? new Date(Math.max(...stamps)).toISOString() : fallback
}

// ── Supabase mode: persistent DB archive ──────────────────────
async function handleSupabaseMode(
  forceRefresh = false,
  mode: 'rotate' | 'all' = 'rotate'
): Promise<NextResponse> {
  const db = supabase!

  // 1. Read existing data from DB
  const { data: dbRows, error: dbError } = await db
    .from('gdelt_data')
    .select('*')
    .order('date', { ascending: true })

  const existing = (dbRows || []) as GdeltDbRow[]
  const now = new Date().toISOString()

  // 2. Return DB data unless forced by cron or DB is empty
  if (!forceRefresh && existing.length > 0 && !dbError) {
    const data = toPoints(existing)
    return NextResponse.json({
      data,
      fetchedAt: lastWriteIso(existing, now),
      error: null,
      ...buildFreshness(data),
    } satisfies GdeltApiResponse, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  }

  // 3. Fetch fresh data from GDELT
  const { instMap, toneMap, artMap, failures, allFailed, attempted } =
    await fetchGdeltSignals(mode)

  // If every GDELT request failed, serve the archive untouched — writing here
  // would only bump timestamps and make stale data look fresh.
  if (allFailed && existing.length > 0) {
    const data = toPoints(existing)
    return NextResponse.json({
      data,
      fetchedAt: lastWriteIso(existing, now),
      error: `GDELT endpoints unavailable, serving archived data (${failures.join('; ')})`,
      ...buildFreshness(data),
    } satisfies GdeltApiResponse, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600' },
    })
  }

  // 4. Merge GDELT data with existing DB data (preserve non-null DB values).
  //    Signals fail independently, so a column whose fetch failed keeps its
  //    previous value rather than being overwritten with null.
  const existingMap = new Map(existing.map(r => [r.date, r]))
  const allDates = new Set([
    ...instMap.keys(),
    ...toneMap.keys(),
    ...artMap.keys(),
    ...existingMap.keys(),
  ])

  const merged: GdeltDbRow[] = Array.from(allDates).sort().map(date => {
    const prev = existingMap.get(date)
    const next = {
      date,
      instability: instMap.get(date) ?? prev?.instability ?? null,
      tone: toneMap.get(date) ?? prev?.tone ?? null,
      artvolnorm: artMap.get(date) ?? prev?.artvolnorm ?? null,
    }
    const unchanged =
      prev !== undefined && SIGNAL_KEYS.every(k => prev[k] === next[k])

    // Only rows whose values actually moved get a new updated_at, so
    // `fetchedAt` keeps meaning "when the data last changed".
    return { ...next, updated_at: unchanged ? prev.updated_at : now }
  })

  // 5. Upsert only the rows that changed
  const changed = merged.filter(row => {
    const prev = existingMap.get(row.date)
    return prev === undefined || SIGNAL_KEYS.some(k => prev[k] !== row[k])
  })

  if (changed.length > 0) {
    const { error: upsertError } = await db
      .from('gdelt_data')
      .upsert(changed, { onConflict: 'date' })

    if (upsertError) {
      const data = toPoints(existing)
      return NextResponse.json({
        data,
        fetchedAt: lastWriteIso(existing, now),
        error: `Failed to persist GDELT data: ${upsertError.message}`,
        ...buildFreshness(data),
      } satisfies GdeltApiResponse, { status: 500 })
    }
  }

  // 6. Return merged data
  const responseData = toPoints(merged)

  return NextResponse.json({
    data: responseData,
    fetchedAt: lastWriteIso(merged, now),
    // A partial failure still returns 200 with data, but says which signals
    // are not advancing — this is what previously went unreported for months.
    error: failures.length > 0
      ? `Partial GDELT refresh of [${attempted.join(', ')}], ${changed.length} row(s) written (${failures.join('; ')})`
      : null,
    ...buildFreshness(responseData),
  } satisfies GdeltApiResponse, {
    headers: {
      'Cache-Control': failures.length > 0
        ? 'public, s-maxage=3600, stale-while-revalidate=3600'
        : 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  })
}

// ── Mock mode: in-memory cache + mock data fallback ───────────
async function handleMockMode(): Promise<NextResponse> {
  // Return cached if fresh
  if (mockCache && Date.now() - mockCacheTimestamp < 24 * 60 * 60 * 1000) {
    return NextResponse.json(mockCache, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  }

  const { instMap, toneMap, artMap, failures, allFailed } = await fetchGdeltSignals('all')

  if (allFailed) {
    // Return stale cache or empty
    if (mockCache) {
      return NextResponse.json(
        {
          ...mockCache,
          error: `GDELT fetch failed, serving cached data (${failures.join('; ')})`,
        } satisfies GdeltApiResponse,
        { headers: { 'Cache-Control': 'public, s-maxage=1800' } }
      )
    }
    return NextResponse.json(
      {
        data: [],
        fetchedAt: new Date().toISOString(),
        error: `All GDELT endpoints unavailable (${failures.join('; ')})`,
        latestDataDate: null,
        stalenessDays: null,
      } satisfies GdeltApiResponse,
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
    error: failures.length > 0
      ? `Partial GDELT refresh (${failures.join('; ')})`
      : null,
    ...buildFreshness(merged),
  }

  mockCache = response
  mockCacheTimestamp = Date.now()

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}

// ── Main handler ──────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    // Cron job or manual trigger can force a refresh with ?force=true
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'

    // Refreshing hits GDELT and writes to the DB, so it is gated by CRON_SECRET
    // exactly like the other cron endpoints. Plain reads stay public — the
    // dashboard fetches this route from the browser.
    if (forceRefresh) {
      const cronSecret = process.env.CRON_SECRET
      if (cronSecret) {
        const authHeader = request.headers.get('authorization')
        const isAuthorized =
          authHeader === `Bearer ${cronSecret}` ||
          searchParams.get('secret') === cronSecret

        if (!isAuthorized) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    }
    // ?all=true fetches every signal in one run (slow; for manual backfills).
    // The daily cron omits it and rotates one signal per run instead.
    const mode = searchParams.get('all') === 'true' ? 'all' : 'rotate'

    if (IS_MOCK_MODE || !supabase) {
      return await handleMockMode()
    }
    return await handleSupabaseMode(forceRefresh, mode)
  } catch (err) {
    return NextResponse.json(
      {
        data: [],
        fetchedAt: new Date().toISOString(),
        error: String(err),
        latestDataDate: null,
        stalenessDays: null,
      } satisfies GdeltApiResponse,
      { status: 502 }
    )
  }
}
