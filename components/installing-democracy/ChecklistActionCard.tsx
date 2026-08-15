'use client'

import { ExternalLink, CalendarDays } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { PILLAR_ICONS, ACTOR_ICONS } from './icons'
import { phaseForMonth } from '@/data/transition-phases'
import { PHASE_KEY_BY_NUMBER } from '@/lib/transition'
import type { TransitionAction } from '@/types'

const STATUS_STYLES: Record<TransitionAction['status'], string> = {
  completed: 'bg-signal-teal/15 text-signal-teal border-signal-teal/30',
  in_progress: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30',
  stalled: 'bg-signal-red/15 text-signal-red border-signal-red/30',
  // Light pill per §6 — needs dark text since the pill itself is light.
  pending: 'bg-[#e4e4e7] text-[#111113] border-transparent',
}

interface ChecklistActionCardProps {
  action: TransitionAction
  compact?: boolean
}

export function ChecklistActionCard({ action, compact = false }: ChecklistActionCardProps) {
  const { t, locale } = useTranslation()

  const PillarIcon = PILLAR_ICONS[action.pillar]
  const phaseKey = PHASE_KEY_BY_NUMBER[phaseForMonth(action.month)]
  const pillarLabel = t(`installingDemocracy.pillars.${action.pillar}`)
  const phaseLabel = t(`installingDemocracy.phases.${phaseKey}.title`)
  const actionText = locale === 'es' ? action.actionEs : action.actionEn
  const indicatorText = locale === 'es' ? action.indicatorEs : action.indicatorEn
  const responsibleText = locale === 'es' ? action.responsibleEs : action.responsibleEn
  const evidenceText = locale === 'es' ? action.evidenceEs : action.evidenceEn

  return (
    <div className="card p-4 md:p-5 space-y-3">
      {/* Status badge */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border',
            STATUS_STYLES[action.status]
          )}
        >
          {t(`installingDemocracy.status.${action.status}`)}
        </span>
        {/* Venezuelan flag colour key: gold = milestone, blue = pillar, red = actors. */}
        <span className="inline-flex items-start justify-end gap-1.5 text-[10px] text-umbral-muted font-mono text-right">
          <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-px" aria-hidden="true" />
          {/* The icon replaces the word "Milestone:", so keep it for screen readers. */}
          <span className="sr-only">{t('installingDemocracy.filters.milestone')}: </span>
          <span>
            {phaseLabel} ·{' '}
            {t('installingDemocracy.action.month').replace('{n}', String(action.month))}
          </span>
        </span>
      </div>

      {/* Pillar badge */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-umbral-muted">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-umbral-ash/50 border border-umbral-steel">
          {PillarIcon && <PillarIcon className="w-3.5 h-3.5 text-signal-blue" aria-hidden="true" />}
          <span className="text-umbral-light">{pillarLabel}</span>
        </span>
      </div>

      {/* Action text */}
      <p className="text-sm md:text-base text-white font-medium leading-snug">{actionText}</p>

      {/* Verifiable indicator */}
      <div>
        <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-0.5">
          {t('installingDemocracy.action.indicator')}
        </p>
        <p className="text-xs md:text-sm text-umbral-light">{indicatorText}</p>
      </div>

      {/* Responsible actors */}
      <div>
        <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-1.5">
          {t('installingDemocracy.action.responsible')}
        </p>
        <div className="flex flex-wrap gap-1.5" title={responsibleText}>
          {action.actors.map(key => {
            const Icon = ACTOR_ICONS[key]
            const label = t(`installingDemocracy.actors.${key}`)
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-umbral-charcoal border border-umbral-ash text-[10px] text-umbral-light"
                title={label}
              >
                {Icon && <Icon className="w-3 h-3 text-signal-red shrink-0" aria-hidden="true" />}
                {!compact && <span>{label}</span>}
                {compact && <span className="sr-only">{label}</span>}
              </span>
            )
          })}
        </div>
      </div>

      {/* Evidence note */}
      {evidenceText && (
        <div className="pt-1 border-t border-umbral-ash/50">
          <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-0.5">
            {t('installingDemocracy.action.evidence')}
          </p>
          <p className="text-xs text-umbral-light">{evidenceText}</p>
        </div>
      )}

      {/* Sources */}
      {action.sources.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex flex-wrap gap-2">
            {action.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-signal-teal hover:underline"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                {source.title || source.url}
              </a>
            ))}
          </div>
          <span className="text-[9px] text-umbral-muted ml-auto shrink-0">
            {t('installingDemocracy.action.sources').replace('{count}', String(action.sources.length))}
          </span>
        </div>
      )}
    </div>
  )
}
