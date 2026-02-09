'use client'

import { TrendingDown, Shield, TrendingUp, MoveDown, Landmark, Undo, LockKeyhole, RotateCcw, Vote, HandFist } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn, getStatusBgColor, getScenarioBgColor } from '@/lib/utils'
import type { Scenario } from '@/types'

interface ScenarioCardProps {
  scenario: Scenario
  className?: string
  onClick?: () => void
  isActive?: boolean
}

const statusIcons = {
  critical: MoveDown,
  warning: TrendingDown,
  stable: TrendingUp,
  neutral: Shield,
}

const scenarioIcons = {
  democraticTransition: Landmark,
  preemptedDemocraticTransition: Undo,
  stabilizedElectoralAutocracy: Vote,
  revertedLiberalization: RotateCcw,
  regressedAutocracy: HandFist,
}

export function ScenarioCard({ scenario, className, onClick, isActive }: ScenarioCardProps) {
  const { t } = useTranslation()

  const Icon = statusIcons[scenario.status] || Shield
  const ScenarioIcon = scenarioIcons[scenario.key] || Shield
  const name = t(`scenarios.${scenario.key}.name`)
  const description = t(`scenarios.${scenario.key}.description`)
  const probabilityLabel = t(`landing.scenarios.${scenario.probability_label}`)

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative card p-5 transition-all duration-300',
        'hover:border-umbral-steel hover:bg-umbral-slate/30',
        'group',
        'flex flex-col justify-between',
        onClick && 'cursor-pointer',
        isActive && 'bg-umbral-slate/30',
        isActive && scenario.status === 'critical' && '!border-signal-red',
        isActive && scenario.status === 'warning' && '!border-signal-amber',
        isActive && scenario.status === 'stable' && '!border-signal-teal',
        isActive && scenario.status === 'neutral' && '!border-umbral-muted',
        className
      )}
    >
      {/* Scenario icon */}
      <div
        className={cn(
          'w-20 h-20 mx-auto mb-4 rounded-lg flex items-center justify-center shrink-0',
          'border transition-colors',
          getScenarioBgColor(scenario.key)
        )}
      >
        <ScenarioIcon
          className={cn(
          // 'block' ensures the SVG behaves predictably within the flex container
          'w-10 h-10 block transition-transform group-hover:scale-110',
          'text-signal-blue'
          )}
        />
      </div>

      {/* Content */}
      <div className="space-y-2 text-center">
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-base font-semibold text-white leading-tight text-center">
            {name}
          </h3>
        </div>
        
        <p className="text-sm text-umbral-muted leading-relaxed">
          {description}
        </p>
      </div>

{/* Probability indicator */}
<div className="mt-4 pt-4 border-t border-umbral-ash">
  <div className="flex items-start gap-3">
    {/* Small Icon on the left */}
    <div
      className={cn(
        'w-12 h-12 rounded-md flex items-center justify-center shrink-0 border transition-colors',
        getStatusBgColor(scenario.status)
      )}
    >
      <Icon
        className={cn(
          'w-6 h-6 transition-transform group-hover:scale-110',
          scenario.status === 'critical' && 'text-signal-red',
          scenario.status === 'warning' && 'text-signal-amber',
          scenario.status === 'stable' && 'text-signal-teal',
          scenario.status === 'neutral' && 'text-umbral-muted'
        )}
      />
    </div>

          {/* Probability Label and Progress Bar container */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-umbral-muted">
                {t('landing.scenarios.probability')}:<br />{probabilityLabel}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="h-1.5 bg-umbral-ash rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  scenario.status === 'critical' && 'bg-signal-red',
                  scenario.status === 'warning' && 'bg-signal-amber',
                  scenario.status === 'stable' && 'bg-signal-teal',
                  scenario.status === 'neutral' && 'bg-umbral-muted'
                )}
                style={{ width: `${scenario.probability}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
