import type { GdeltAnnotation, GdeltAnnotationTier, GdeltSignalKey } from '@/types/gdelt'

export const GDELT_ANNOTATIONS: GdeltAnnotation[] = [
  { date: '2026-01-03', tier: 'CRITICAL', label_en: 'US Operation / Maduro captured', label_es: 'Operación de EE.UU. / Maduro capturado' },
  { date: '2026-01-05', tier: 'HIGH', label_en: 'Delcy Rodríguez sworn in', label_es: 'Delcy Rodríguez juramentada' },
  { date: '2026-01-10', tier: 'HIGH', label_en: 'Emergency decree + crackdowns', label_es: 'Decreto de emergencia + represión' },
  { date: '2026-01-15', tier: 'MEDIUM', label_en: 'Machado meets Trump', label_es: 'Machado se reúne con Trump' },
  { date: '2026-01-20', tier: 'MEDIUM', label_en: '$300M oil payment deal', label_es: 'Acuerdo petrolero de $300M' },
  { date: '2026-01-29', tier: 'MEDIUM', label_en: 'Hydrocarbon law signed', label_es: 'Ley de hidrocarburos firmada' },
  { date: '2026-02-05', tier: 'LOW', label_en: 'Amnesty law debate begins', label_es: 'Comienza debate de ley de amnistía' },
  { date: '2026-02-12', tier: 'LOW', label_en: 'Rodríguez pledges elections (NBC)', label_es: 'Rodríguez promete elecciones (NBC)' },
]

export const TIER_COLORS: Record<GdeltAnnotationTier, string> = {
  CRITICAL: '#ff2222',
  HIGH: '#ff7733',
  MEDIUM: '#f5c842',
  LOW: '#3bf0ff',
}

export const SIGNAL_COLORS: Record<GdeltSignalKey, string> = {
  instability: '#ff3b3b',
  tone: '#3bf0ff',
  artvolnorm: '#f5c842',
}
