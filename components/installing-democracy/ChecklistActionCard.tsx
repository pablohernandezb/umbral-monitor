'use client'

import { ExternalLink, CalendarDays } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { PILLAR_ICONS, ACTOR_ICONS } from './icons'
import { phaseForMonth } from '@/data/transition-phases'
import { PHASE_KEY_BY_NUMBER, expertStatusTone, type ExpertStatusTone } from '@/lib/transition'
import { LikertSelector } from './LikertSelector'
import type { TransitionAction, EvaluationAggregate } from '@/types'

// Same 4-state legend as the methodology panel (Cumplida/En progreso/
// Pendiente/No evaluable) — this badge is now fully automatic, computed from
// expertStatusTone(aggregate), not the admin-curated `action.status` it used
// to show. The admin status still exists in the data model and admin panel;
// it just no longer renders on the public card.
const EXPERT_STATUS_STYLES: Record<ExpertStatusTone, string> = {
  completed: 'bg-signal-teal/15 text-signal-teal border-signal-teal/30',
  inProgress: 'bg-signal-amber/15 text-signal-amber border-signal-amber/30',
  pending: 'bg-signal-red/15 text-signal-red border-signal-red/30',
  // Light pill — needs dark text since the pill itself is light.
  unrated: 'bg-[#e4e4e7] text-[#111113] border-transparent',
}

interface ChecklistActionCardProps {
  action: TransitionAction
  compact?: boolean
  /** Public completion data for this action. Undefined/zero renders as
   * "not yet evaluated" rather than a misleading empty 0% bar. */
  aggregate?: EvaluationAggregate
  /** Renders a 0–4 LikertSelector in place of the completion bar — used by
   * the Returning Expert evaluation form. `evaluationValue`/`onEvaluate`
   * are required together with this. */
  evaluate?: boolean
  evaluationValue?: number
  onEvaluate?: (score: number | undefined) => void
  evaluateDisabled?: boolean
}

export function ChecklistActionCard({
  action,
  compact = false,
  aggregate,
  evaluate = false,
  evaluationValue,
  onEvaluate,
  evaluateDisabled,
}: ChecklistActionCardProps) {
  const { t, locale } = useTranslation()

  const PillarIcon = PILLAR_ICONS[action.pillar]
  const phaseKey = PHASE_KEY_BY_NUMBER[phaseForMonth(action.month)]
  const pillarLabel = t(`installingDemocracy.pillars.${action.pillar}`)
  const phaseLabel = t(`installingDemocracy.phases.${phaseKey}.title`)
  const actionText = locale === 'es' ? action.actionEs : action.actionEn
  const indicatorText = locale === 'es' ? action.indicatorEs : action.indicatorEn
  const responsibleText = locale === 'es' ? action.responsibleEs : action.responsibleEn
  const evidenceText = locale === 'es' ? action.evidenceEs : action.evidenceEn
  const tone = expertStatusTone(aggregate)

  return (
    <div
      className={cn(
        'card p-4 md:p-5 space-y-3',
        // Admin-only visual flag (transition_checklist.is_alert) — purely
        // presentational, same red pulse the fact-check feed uses for
        // flagged tweets. No rotation/tilt, no badge/text added.
        action.isAlert && 'border-2 border-signal-red/40 animate-pulse-border shadow-[0_0_15px_rgba(220,38,38,0.15)]'
      )}
    >
      {/* Expert completion — the PRIMARY signal (monitoring spec §10).
          Bar + percentage only; the "expert-assessed" label and the
          evaluator-count/not-evaluated line are covered by the status badge
          below instead, so they aren't repeated here. */}
      {!evaluate && (
        <div>
          <div className="flex items-center justify-end mb-1">
            <p className="text-xs font-bold text-white font-mono">{aggregate?.completionPct ?? 0}%</p>
          </div>
          <div className="h-1.5 rounded-full bg-[#e4e4e7]/80 overflow-hidden">
            <div
              className="h-full bg-signal-teal transition-all duration-500"
              style={{ width: `${aggregate?.completionPct ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Status badge — automatic, computed from expertStatusTone(aggregate).
          Below 5 evaluators this always reads "unrated" regardless of mean
          score (see MIN_EVALUATORS_FOR_ASSESSMENT in lib/transition.ts), so
          this badge and the % above can never disagree: the same threshold
          zeroes an under-5 item's contribution to every rollup too. The
          admin-curated `status` still exists for internal use (admin panel)
          but no longer renders here. */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide border',
            EXPERT_STATUS_STYLES[tone]
          )}
        >
          {t(`installingDemocracy.expertStatus.${tone}`)}
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

      {/* Evaluation control — replaces the public completion bar in evaluate mode */}
      {evaluate && (
        <div>
          <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-1.5">
            {t('installingDemocracy.action.completion')}
          </p>
          <LikertSelector
            value={evaluationValue}
            onChange={score => onEvaluate?.(score)}
            actionLabel={actionText}
            disabled={evaluateDisabled}
          />
        </div>
      )}

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
