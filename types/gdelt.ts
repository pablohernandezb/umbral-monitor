// ============================================================
// GDELT Signal Dashboard Types
// ============================================================

export interface GdeltDataPoint {
  date: string                    // "YYYY-MM-DD"
  instability: number | null      // Conflict/instability index
  tone: number | null             // Media tone (typically -10 to +2)
  artvolnorm: number | null       // Normalized article volume
}

export interface GdeltApiResponse {
  data: GdeltDataPoint[]
  /** When the archive last actually changed (not when this response was built). */
  fetchedAt: string
  error: string | null
  /** Newest date carrying a non-null value for any signal ("YYYY-MM-DD"). */
  latestDataDate?: string | null
  /**
   * Age in whole days of the STALEST signal — not the newest. Signals fail
   * independently, so this is the only measure that catches a partly frozen
   * chart. Null when there is no data at all.
   */
  stalenessDays?: number | null
  /** The signal `stalenessDays` refers to. */
  stalestSignal?: GdeltSignalKey | null
  /** Signals with no stored data whatsoever. */
  missingSignals?: GdeltSignalKey[]
  /**
   * Newest date per signal. Signals fail independently upstream, so these
   * can diverge — a single stale signal is invisible in `latestDataDate`.
   */
  signalLastDates?: Record<GdeltSignalKey, string | null>
}

export type GdeltSignalKey = 'instability' | 'tone' | 'artvolnorm'

export type GdeltAnnotationTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface GdeltAnnotation {
  date: string
  tier_en: GdeltAnnotationTier
  tier_es: string
  label_en: string
  label_es: string
}

/** DB-backed GDELT timeline event (superset of GdeltAnnotation) */
export interface GdeltEvent {
  id: string
  date: string              // YYYY-MM-DD
  tier_en: GdeltAnnotationTier
  tier_es: string
  label_en: string
  label_es: string
  created_at: string
}
