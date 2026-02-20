// ============================================================
// IODA (Internet Outage Detection and Analysis) Type Definitions
// Georgia Tech / INETINTEL API v2
// ============================================================

/** A geo-political entity tracked by IODA (country, region, ASN) */
export interface IODAEntity {
  type: string
  code: string
  name: string
  attrs: Record<string, string | number | boolean | null>
}

/**
 * A raw time-series signal from one datasource.
 * Timestamps are reconstructed as: from + (index * step)
 */
export interface IODASignal {
  datasource: string          // 'bgp' | 'ping-slash24' | 'ucsd-nt'
  entityType: string
  entityCode: string
  from: number                // Unix epoch seconds
  until: number               // Unix epoch seconds
  step: number                // Seconds between data points
  values: (number | null)[]   // null = missing/unknown
}

/** A discrete outage event detected by IODA */
export interface IODAOutageEvent {
  id?: string
  datasource: string
  start: number               // Unix epoch seconds
  duration: number            // Seconds
  score: number               // Severity score
  overallScore?: number
  location?: string
}

/** An alert triggered when a signal crosses a threshold */
export interface IODAAlert {
  datasource: string
  entity: IODAEntity
  time: number                // Unix epoch seconds
  level: string               // 'critical' | 'warning' | 'normal'
  value: number               // Current signal value
  historyValue: number        // Historical baseline value
}

/**
 * Normalized point for Recharts rendering.
 * All three datasources are merged at the same timestamp.
 */
export interface NormalizedSignalPoint {
  time: string            // Human-readable label for X-axis
  timestamp: number       // Raw Unix seconds, used for reference lines
  bgp: number | null
  probing: number | null
  telescope: number | null
}

/** Generic API response wrapper, mirrors the project's ApiResponse<T> pattern */
export interface IODAApiResponse<T> {
  data: T | null
  error: string | null
}

/** Raw IODA v2 envelope shapes */
export interface IODARawSignalsEnvelope {
  data: {
    signals: IODASignal[]
  } | null
}

export interface IODARawEventsEnvelope {
  data: {
    events: IODAOutageEvent[]
  } | null
}

export interface IODARawAlertsEnvelope {
  data: {
    alerts: IODAAlert[]
  } | null
}

export interface IODARawEntitiesEnvelope {
  data: {
    entities: IODAEntity[]
  } | null
}

/** Connectivity status derived from live signal values */
export type ConnectivityStatus = 'normal' | 'degraded' | 'outage' | 'no-data'

/** Score thresholds for severity classification */
export const SCORE_THRESHOLDS = {
  low: 100,
  medium: 500,
} as const

/** Time range options available in the dashboard */
export type TimeRange = '24h' | '48h' | '7d'

export const TIME_RANGE_HOURS: Record<TimeRange, number> = {
  '24h': 24,
  '48h': 48,
  '7d': 168,
}
