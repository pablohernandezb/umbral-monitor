'use client'

import { useTranslation } from '@/i18n'
import { PILLAR_ICONS } from './icons'
import type { PillarProgress } from '@/types'

interface PillarProgressPanelProps {
  pillars: PillarProgress[]
}

/**
 * Every pillar, always. This used to show 6 behind a "show more" toggle, which
 * made sense against the original 19 pillars; since the Oct 2026 regrouping
 * there are only 10, so the whole set fits and hiding any of it would just
 * cost a click.
 */
export function PillarProgressPanel({ pillars }: PillarProgressPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      {pillars.map(pillar => {
        const Icon = PILLAR_ICONS[pillar.pillar]
        return (
          <div key={pillar.pillar} className="flex items-center gap-3">
            {/* Blue matches the pillar-icon colour on the action cards
                (Venezuelan flag key: gold = milestone, blue = pillar, red = actors). */}
            {Icon && <Icon className="w-4 h-4 text-signal-blue shrink-0" aria-hidden="true" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs text-umbral-light truncate">
                  {t(`installingDemocracy.pillars.${pillar.pillar}`)}
                </p>
                <p className="text-xs font-mono text-umbral-muted shrink-0">
                  {pillar.completionPct}%
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-[#e4e4e7]/80 overflow-hidden">
                <div
                  className="h-full bg-signal-teal transition-all duration-500"
                  style={{ width: `${pillar.completionPct}%` }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
