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
  tier: GdeltAnnotationTier
  label_en: string
  label_es: string
}
