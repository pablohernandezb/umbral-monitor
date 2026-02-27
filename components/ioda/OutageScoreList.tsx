'use client'

import { useTranslation } from '@/i18n'
import { severityColor, formatOutageScore } from '@/lib/ioda'
import type { StateOutageScore } from '@/types/ioda'

interface OutageScoreListProps {
  scores: StateOutageScore[]
  hoveredState: string | null
  onHoverState: (code: string | null) => void
  loading?: boolean
}

export function OutageScoreList({ scores, hoveredState, onHoverState, loading }: OutageScoreListProps) {
  const { locale } = useTranslation()

  // Only show states with score > 0, already sorted by score desc
  const nonZero = scores.filter((s) => s.score > 0)

  if (loading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 bg-umbral-ash/10 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (nonZero.length === 0) {
    return (
      <div className="text-[10px] font-mono text-umbral-muted py-3 text-center">
        {locale === 'es' ? 'Sin interrupciones detectadas' : 'No outages detected'}
      </div>
    )
  }

  // Find the max score for the bar scale
  const maxScore = nonZero[0]?.score ?? 1

  return (
    <div className="space-y-0.5 md:max-h-[260px] md:overflow-y-auto">
      {/* Header row */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[9px] font-mono text-umbral-muted uppercase tracking-wider">
          {locale === 'es' ? 'Región' : 'Region'}
        </span>
        <span className="text-[9px] font-mono text-umbral-muted uppercase tracking-wider">
          {locale === 'es' ? 'Puntaje' : 'Outage Score'}
        </span>
      </div>

      {nonZero.map((entry) => {
        const isHovered = hoveredState === entry.regionCode
        const barWidth = Math.max(2, (entry.score / maxScore) * 100)

        return (
          <div
            key={entry.regionCode}
            className={`relative flex items-center justify-between px-2 py-1.5 rounded transition-colors cursor-pointer ${
              isHovered ? 'bg-umbral-ash/30' : 'hover:bg-umbral-ash/15'
            }`}
            onMouseEnter={() => onHoverState(entry.regionCode)}
            onMouseLeave={() => onHoverState(null)}
          >
            {/* Background bar */}
            <div
              className="absolute inset-y-0 left-0 rounded opacity-15 transition-all"
              style={{
                width: `${barWidth}%`,
                backgroundColor: severityColor(entry.severity),
              }}
            />

            {/* Content */}
            <div className="relative flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: severityColor(entry.severity) }}
              />
              <span className={`text-xs font-mono ${isHovered ? 'text-white' : 'text-umbral-light'}`}>
                {entry.regionName}
              </span>
            </div>

            <span
              className="relative text-xs font-mono font-bold"
              style={{ color: severityColor(entry.severity) }}
            >
              {formatOutageScore(entry.score)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
