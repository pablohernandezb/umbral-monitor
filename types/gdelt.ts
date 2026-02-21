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
  fetchedAt: string
  error: string | null
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
