import type {
  IODAApiResponse,
  IODAEntity,
  IODASignal,
  IODAOutageEvent,
  IODAAlert,
  IODARawSignalsEnvelope,
  IODARawEventsEnvelope,
  IODARawAlertsEnvelope,
  IODARawEntitiesEnvelope,
  NormalizedSignalPoint,
  TimeRange,
  TIME_RANGE_HOURS,
  RegionsBatchResponse,
  RegionSignalData,
  OutageSeverity,
  StateOutageScore,
  OutageScoresBatchResponse,
} from '@/types/ioda'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a URL pointing at our internal IODA proxy */
function proxyUrl(path: string, params: Record<string, string> = {}): string {
  const qs = new URLSearchParams({ path, ...params })
  return `/api/ioda?${qs}`
}

/** Return Unix epoch (seconds) for N hours ago */
export function hoursAgo(hours: number): number {
  return Math.floor((Date.now() - hours * 3_600_000) / 1000)
}

/** Return current Unix epoch (seconds) */
export function nowEpoch(): number {
  return Math.floor(Date.now() / 1000)
}

/** Format a Unix epoch (seconds) timestamp for display */
export function formatEpoch(epoch: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(epoch * 1000).toLocaleString('en-US', {
    timeZone: 'America/Caracas',
    ...options,
  })
}

/** Format a duration in seconds into "Xh Ym" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ── Core Fetch ─────────────────────────────────────────────────────────────

async function iodaFetch<T>(path: string, params: Record<string, string> = {}): Promise<IODAApiResponse<T>> {
  try {
    const res = await fetch(proxyUrl(path, params), { cache: 'no-store' })
    if (!res.ok) {
      const err: { error?: string } = await res.json().catch(() => ({}))
      return { data: null, error: err.error ?? `HTTP ${res.status}` }
    }
    const json = await res.json() as T
    return { data: json, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}

// ── API Functions ──────────────────────────────────────────────────────────

/**
 * Fetch raw time-series signals for a given entity over the last N hours.
 * Returns one IODASignal per datasource (bgp, ping-slash24, ucsd-nt).
 */
export async function getSignals(
  entityType: string,
  entityCode: string,
  hours: number
): Promise<IODAApiResponse<IODASignal[]>> {
  const from = String(hoursAgo(hours))
  const until = String(nowEpoch())

  // IODA v2 envelope: { data: [[sig1, sig2, ...]] } — one outer array wrapping per-entity signal arrays
  const result = await iodaFetch<{ data?: unknown[][] }>(
    `signals/raw/${entityType}/${entityCode}`,
    { from, until }
  )

  if (result.error || !result.data) {
    return { data: null, error: result.error }
  }

  const signals = Array.isArray(result.data.data)
    ? (result.data.data as unknown[][]).flat() as IODASignal[]
    : []
  return { data: signals, error: null }
}

/**
 * Fetch discrete outage events for a given entity over the last N hours.
 */
export async function getOutageEvents(
  entityType: string,
  entityCode: string,
  hours: number
): Promise<IODAApiResponse<IODAOutageEvent[]>> {
  const from = String(hoursAgo(hours))
  const until = String(nowEpoch())

  // Correct IODA v2 path: /outages/events with entityType/entityCode as query params
  const result = await iodaFetch<{ data?: unknown }>(
    'outages/events',
    { entityType, entityCode, from, until }
  )

  if (result.error || !result.data) {
    return { data: null, error: result.error }
  }

  const events = Array.isArray(result.data.data) ? (result.data.data as IODAOutageEvent[]) : []
  return { data: events, error: null }
}

/**
 * Fetch threshold alerts for a given entity over the last N hours.
 */
export async function getOutageAlerts(
  entityType: string,
  entityCode: string,
  hours: number
): Promise<IODAApiResponse<IODAAlert[]>> {
  const from = String(hoursAgo(hours))
  const until = String(nowEpoch())

  // Correct IODA v2 path: /outages/alerts with entityType/entityCode as query params
  const result = await iodaFetch<{ data?: unknown }>(
    'outages/alerts',
    { entityType, entityCode, from, until, limit: '50' }
  )

  if (result.error || !result.data) {
    return { data: null, error: result.error }
  }

  const alerts = Array.isArray(result.data.data) ? (result.data.data as IODAAlert[]) : []
  return { data: alerts, error: null }
}

/**
 * Fetch all Venezuelan state/region entities from IODA.
 * Codes follow the VE.{letter} format (e.g., VE.A, VE.B …).
 */
export async function getVenezuelaRegions(): Promise<IODAApiResponse<IODAEntity[]>> {
  // Correct IODA v2 path: /entities/query with entityType as query param
  const result = await iodaFetch<{ data?: unknown }>(
    'entities/query',
    { entityType: 'region', relatedTo: 'country/VE' }
  )

  if (result.error || !result.data) {
    return { data: null, error: result.error }
  }

  const entities = Array.isArray(result.data.data) ? (result.data.data as IODAEntity[]) : []
  // Sort alphabetically by name for the region selector
  const sorted = [...entities].sort((a, b) => a.name.localeCompare(b.name))
  return { data: sorted, error: null }
}

// ── Normalization ──────────────────────────────────────────────────────────

/**
 * Merge multiple single-datasource IODASignal arrays into a unified array
 * of NormalizedSignalPoint objects suitable for Recharts.
 *
 * Strategy: use the signal with the finest step to anchor the time axis,
 * then map other datasources onto the nearest matching index.
 */
export function normalizeSignalSeries(signals: IODASignal[]): NormalizedSignalPoint[] {
  const bgp      = signals.find(s => s.datasource === 'bgp')
  const probing  = signals.find(s => s.datasource === 'ping-slash24')
  // 'ucsd-nt' (UCSD telescope) was replaced by 'merit-nt' in IODA v2
  const telescope = signals.find(s => s.datasource === 'ucsd-nt') ?? signals.find(s => s.datasource === 'merit-nt')

  // Use the longest series as the time axis anchor
  const anchor = [bgp, probing, telescope]
    .filter((s): s is IODASignal => s !== undefined)
    .sort((a, b) => b.values.length - a.values.length)[0]

  if (!anchor) return []

  // Helper: given a different signal, find the value at the same wall-clock time
  function valueAt(signal: IODASignal | undefined, anchorTimestamp: number): number | null {
    if (!signal) return null
    // Index within that signal's array: (targetTime - signal.from) / signal.step
    const idx = Math.round((anchorTimestamp - signal.from) / signal.step)
    if (idx < 0 || idx >= signal.values.length) return null
    return signal.values[idx] ?? null
  }

  return anchor.values.map((_, i) => {
    // Reconstruct wall-clock timestamp for this index
    const ts = anchor.from + i * anchor.step

    return {
      time: formatEpoch(ts, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
      timestamp: ts,
      bgp:       valueAt(bgp, ts),
      probing:   valueAt(probing, ts),
      telescope: valueAt(telescope, ts),
    }
  })
}

// ── Time Range Utilities ───────────────────────────────────────────────────

export { hoursAgo as getFromTimestamp }

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '24h': '24h',
  '48h': '48h',
  '7d':  '7d',
}

// ── Supabase-backed dashboard data ─────────────────────────────────────────

export interface StoredDashboardData {
  signals: NormalizedSignalPoint[]
  events: IODAOutageEvent[]
  fetchedAt: string
  error: string | null
}

/**
 * Reads pre-stored IODA signals and events from Supabase via the sync route.
 * Use this in Supabase mode instead of calling IODA live.
 */
export async function getStoredDashboardData(
  entityType: string,
  entityCode: string,
  hours: number
): Promise<IODAApiResponse<StoredDashboardData>> {
  const from = hoursAgo(hours)
  const until = nowEpoch()

  const qs = new URLSearchParams({
    entity_type: entityType,
    entity_code: entityCode,
    from: String(from),
    until: String(until),
  })

  try {
    const res = await fetch(`/api/ioda/sync?${qs}`, { cache: 'no-store' })
    if (!res.ok) {
      return { data: null, error: `HTTP ${res.status}` }
    }
    const json = await res.json() as StoredDashboardData
    return { data: json, error: json.error }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}

// ── Subnational Region Signals ────────────────────────────────────────────

/**
 * Client-side fetcher: loads batch region signals from our internal API.
 */
export async function getRegionSignals(
  datasource: string = 'bgp',
  hours: number = 24
): Promise<RegionsBatchResponse> {
  const qs = new URLSearchParams({ datasource, hours: String(hours) })
  const res = await fetch(`/api/ioda/regions?${qs}`, { cache: 'no-store' })
  if (!res.ok) {
    return { datasource, regions: [], fetchedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
  }
  return res.json() as Promise<RegionsBatchResponse>
}

/**
 * Client-side fetcher: loads real IODA outage scores for all 25 regions.
 */
export async function getRegionOutageScores(): Promise<OutageScoresBatchResponse> {
  const res = await fetch('/api/ioda/outages', { cache: 'no-store' })
  if (!res.ok) {
    return { scores: [], fetchedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
  }
  return res.json() as Promise<OutageScoresBatchResponse>
}

/**
 * Supabase mode: reads pre-stored region signals from DB via the sync-subnational route.
 */
export async function getStoredRegionSignals(datasource: string): Promise<RegionsBatchResponse> {
  const res = await fetch(
    `/api/ioda/sync-subnational?datasource=${encodeURIComponent(datasource)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) {
    return { datasource, regions: [], fetchedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
  }
  return res.json() as Promise<RegionsBatchResponse>
}

/**
 * Supabase mode: reads pre-stored region outage scores from DB via the sync-subnational route.
 */
export async function getStoredRegionOutages(): Promise<OutageScoresBatchResponse> {
  const res = await fetch('/api/ioda/sync-subnational?outages=true', { cache: 'no-store' })
  if (!res.ok) {
    return { scores: [], fetchedAt: new Date().toISOString(), error: `HTTP ${res.status}` }
  }
  return res.json() as Promise<OutageScoresBatchResponse>
}

/**
 * Compute an outage score for a single region, matching IODA's approach.
 *
 * For each datasource, the "drop" is the absolute decrease of recent values
 * below the baseline median:  drop = max(0, baseline_median - recent_mean).
 * The final score sums the drops across all datasources.
 *
 * This means large networks (high baseline) with significant drops produce
 * high scores, while small networks or stable ones stay near zero.
 */
export function computeOutageScore(
  bgpValues: (number | null)[],
  probingValues: (number | null)[],
  telescopeValues: (number | null)[]
): number {
  function absoluteDrop(values: (number | null)[]): number {
    const nums = values.filter((v): v is number => v !== null && v >= 0)
    if (nums.length < 4) return 0

    // Baseline: median of first 80% of the window
    const baselineSlice = nums.slice(0, Math.max(4, Math.floor(nums.length * 0.8)))
    const sorted = [...baselineSlice].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    if (median === 0) return 0

    // Recent: mean of last 10% of the window
    const recentSlice = nums.slice(Math.max(0, nums.length - Math.max(3, Math.floor(nums.length * 0.1))))
    const recentMean = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length

    return Math.max(0, median - recentMean)
  }

  const dropBgp = absoluteDrop(bgpValues)
  const dropProbing = absoluteDrop(probingValues)
  const dropTelescope = absoluteDrop(telescopeValues)

  // Sum of absolute drops — matches IODA's scoring where large drops yield large numbers
  return dropBgp + dropProbing + dropTelescope
}

/**
 * Classify an outage score into a severity level.
 * Thresholds calibrated against IODA's observed scores:
 *   Falcón ≈ 700k (critical), Lara ≈ 180k, Anzoátegui ≈ 15k, Miranda ≈ 9.9k (low–degraded)
 */
export function classifyOutageSeverity(score: number): OutageSeverity {
  if (score <= 0) return 'normal'
  if (score < 1000) return 'low'
  if (score < 50000) return 'degraded'
  if (score < 200000) return 'high'
  return 'critical'
}

/**
 * Format an outage score for compact display (e.g. 1.2M, 700k, 320).
 */
export function formatOutageScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`
  if (score >= 1_000) return `${(score / 1_000).toFixed(0)}k`
  return score.toFixed(0)
}

/**
 * Map outage severity to a project color token.
 */
export function severityColor(severity: OutageSeverity): string {
  switch (severity) {
    case 'normal': return '#14b8a6'   // signal-teal
    case 'low': return '#14b8a6'      // signal-teal (dim)
    case 'degraded': return '#f59e0b' // signal-amber
    case 'high': return '#dc2626'     // signal-red
    case 'critical': return '#dc2626' // signal-red
  }
}

/**
 * Severity fill color for SVG map — lighter fills for map readability.
 */
export function severityFill(severity: OutageSeverity): string {
  switch (severity) {
    case 'normal': return '#14b8a620'   // teal very transparent
    case 'low': return '#14b8a640'      // teal transparent
    case 'degraded': return '#f59e0b50' // amber semi-transparent
    case 'high': return '#dc262660'     // red semi-transparent
    case 'critical': return '#dc262690' // red
  }
}

/**
 * Severity border/stroke color for SVG map.
 */
export function severityStroke(severity: OutageSeverity): string {
  switch (severity) {
    case 'normal': return '#14b8a650'
    case 'low': return '#14b8a670'
    case 'degraded': return '#f59e0b80'
    case 'high': return '#dc262680'
    case 'critical': return '#dc2626'
  }
}
