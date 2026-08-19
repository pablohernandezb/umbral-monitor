'use client'

import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { PHASE_KEY_BY_NUMBER } from '@/lib/transition'
import type { PhaseProgress } from '@/types'

interface PhaseProgressPanelProps {
  phases: PhaseProgress[]
}

export function PhaseProgressPanel({ phases }: PhaseProgressPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {phases.map(phase => {
        const key = PHASE_KEY_BY_NUMBER[phase.phase]
        return (
          <div
            key={phase.phase}
            className={cn(
              'p-3 md:p-4 rounded-lg border',
              phase.isActive
                ? 'bg-signal-teal/5 border-signal-teal/30'
                : 'bg-umbral-charcoal/50 border-umbral-ash'
            )}
          >
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <div>
                <p className={cn('text-sm font-semibold', phase.isActive ? 'text-white' : 'text-umbral-light')}>
                  {t(`installingDemocracy.phases.${key}.title`)}
                </p>
                <p className="text-[10px] text-umbral-muted font-mono">
                  {t(`installingDemocracy.phases.${key}.month`)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-white font-mono">{phase.completionPct}%</p>
                <p className="text-[10px] text-umbral-muted font-mono">
                  {phase.evaluatorCount > 0
                    ? t('installingDemocracy.participate.public.experts', { count: phase.evaluatorCount })
                    : t('installingDemocracy.participate.public.notEvaluated')}
                </p>
              </div>
            </div>

            <p className="text-xs text-umbral-muted mb-2">
              {t(`installingDemocracy.phases.${key}.description`)}
            </p>

            <div className="h-1.5 rounded-full bg-[#e4e4e7]/80 overflow-hidden">
              <div
                className="h-full bg-signal-teal transition-all duration-500"
                style={{ width: `${phase.completionPct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
