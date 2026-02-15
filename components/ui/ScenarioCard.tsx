'use client'

import { Shield, Landmark, Undo, RotateCcw, Vote, HandFist, GraduationCap, UsersRound } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn, getScenarioBgColor } from '@/lib/utils'
import type { Scenario } from '@/types'

interface ScenarioCardProps {
  scenario: Scenario
  className?: string
  onClick?: () => void
  isActive?: boolean
  expertRating?: number  // 1-5 mean from expert submissions
  publicRating?: number  // 1-5 mean from public submissions
}

const scenarioIcons = {
  democraticTransition: Landmark,
  preemptedDemocraticTransition: Undo,
  stabilizedElectoralAutocracy: Vote,
  revertedLiberalization: RotateCcw,
  regressedAutocracy: HandFist,
}

const scenarioNumbers: Record<string, string> = {
  democraticTransition: '/images/scenario_number_5.png',
  preemptedDemocraticTransition: '/images/scenario_number_4.png',
  stabilizedElectoralAutocracy: '/images/scenario_number_3.png',
  revertedLiberalization: '/images/scenario_number_2.png',
  regressedAutocracy: '/images/scenario_number_1.png',
}

function getRatingColor(rating: number): string {
  if (rating >= 4) return 'bg-signal-teal'
  if (rating >= 3) return 'bg-signal-amber'
  return 'bg-signal-red'
}

function getRatingLabel(rating: number, locale: string): string {
  if (rating === 0) return locale === 'es' ? 'Sin datos' : 'No data'
  const rounded = Math.round(rating * 10) / 10
  if (rating >= 4) return locale === 'es' ? `${rounded} — Alta` : `${rounded} — High`
  if (rating >= 3) return locale === 'es' ? `${rounded} — Media` : `${rounded} — Medium`
  if (rating >= 2) return locale === 'es' ? `${rounded} — Baja` : `${rounded} — Low`
  return locale === 'es' ? `${rounded} — Muy baja` : `${rounded} — Very low`
}

export function ScenarioCard({ scenario, className, onClick, isActive, expertRating, publicRating }: ScenarioCardProps) {
  const { t, locale } = useTranslation()
  const ScenarioIcon = scenarioIcons[scenario.key] || Shield
  const name = t(`scenarios.${scenario.key}.name`)
  const description = t(`scenarios.${scenario.key}.description`)

  const eRating = expertRating ?? 0
  const pRating = publicRating ?? 0

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
      {/* Scenario number + icon */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {scenarioNumbers[scenario.key] && (
          <img
            src={scenarioNumbers[scenario.key]}
            alt=""
            aria-hidden="true"
            className="w-20 h-20 object-contain shrink-0"
          />
        )}
        <div
          className={cn(
            'w-20 h-20 rounded-lg flex items-center justify-center shrink-0',
            'border transition-colors',
            getScenarioBgColor(scenario.key)
          )}
        >
          <ScenarioIcon
            className={cn(
            'w-10 h-10 block transition-transform group-hover:scale-110',
            'text-signal-blue'
            )}
          />
        </div>
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

      {/* Probability indicators */}
      <div className="mt-4 pt-4 border-t border-umbral-ash space-y-3">
        {/* Expert indicator */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-signal-blue/30 bg-signal-blue/10">
            <GraduationCap className="w-4 h-4 text-signal-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-umbral-muted uppercase tracking-wide">
                {locale === 'es' ? 'Expertos' : 'Experts'}
              </span>
              <span className="text-[10px] font-mono text-umbral-light">
                {getRatingLabel(eRating, locale)}
              </span>
            </div>
            <div className="h-1.5 bg-umbral-ash rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', eRating > 0 ? getRatingColor(eRating) : 'bg-umbral-ash')}
                style={{ width: `${((eRating-1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Public indicator */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-signal-blue/30 bg-signal-blue/10">
            <UsersRound className="w-4 h-4 text-signal-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-umbral-muted uppercase tracking-wide">
                {locale === 'es' ? 'Público' : 'Public'}
              </span>
              <span className="text-[10px] font-mono text-umbral-light">
                {getRatingLabel(pRating, locale)}
              </span>
            </div>
            <div className="h-1.5 bg-umbral-ash rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', pRating > 0 ? getRatingColor(pRating) : 'bg-umbral-ash')}
                style={{ width: `${(pRating / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
