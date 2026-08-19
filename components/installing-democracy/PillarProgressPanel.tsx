'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { PILLAR_ICONS } from './icons'
import type { PillarProgress } from '@/types'

const COLLAPSED_COUNT = 6

interface PillarProgressPanelProps {
  pillars: PillarProgress[]
}

export function PillarProgressPanel({ pillars }: PillarProgressPanelProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const visible = expanded ? pillars : pillars.slice(0, COLLAPSED_COUNT)
  const hasMore = pillars.length > COLLAPSED_COUNT

  return (
    <div className="space-y-2">
      {visible.map(pillar => {
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
              {pillar.evaluatorCount > 0 && (
                <p className="mt-1 text-[10px] text-umbral-muted font-mono">
                  {t('installingDemocracy.participate.public.experts', { count: pillar.evaluatorCount })}
                </p>
              )}
            </div>
          </div>
        )
      })}

      {hasMore && (
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-1 text-xs text-signal-teal hover:underline pt-1"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded
            ? t('installingDemocracy.showLess')
            : `${t('installingDemocracy.showMore')} (+${pillars.length - COLLAPSED_COUNT})`}
        </button>
      )}
    </div>
  )
}
