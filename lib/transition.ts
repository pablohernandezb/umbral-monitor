import type {
  TransitionAction,
  TransitionProgress,
  PhaseProgress,
  PillarProgress,
  EvaluationAggregate,
} from '@/types'
import { TRANSITION_PHASES, phaseForMonth } from '@/data/transition-phases'

export { phaseForMonth }

/** Milestone number -> i18n key stem, derived once from TRANSITION_PHASES. */
export const PHASE_KEY_BY_NUMBER: Record<number, string> = Object.fromEntries(
  TRANSITION_PHASES.map(def => [def.phase, def.key])
)

/**
 * Completion is expert-driven (INSTALLING_DEMOCRACY_MONITORING_SPEC.md §2),
 * superseding the admin `status` counts that drove it before. Per-action %
 * comes from `aggregates` (the public, identity-free
 * `transition_evaluation_aggregates` view); an action with no evaluations
 * contributes 0%, not "unknown" — the denominator is always the full checklist
 * so the headline is honest before experts arrive.
 *
 * Admin `status`/`evidence`/`sources` remain as a secondary annotation layer:
 * tallied below for display, but no longer feeding any percentage.
 */
function itemPctLookup(aggregates: EvaluationAggregate[]): Map<string, EvaluationAggregate> {
  return new Map(aggregates.map(a => [a.actionId, a]))
}

/**
 * An item needs at least this many raters before its score is trusted at
 * all — below that, both the badge and the headline math treat it as
 * "not yet assessable" rather than acting on a thin, possibly unrepresentative
 * sample (a single rater giving 4/4 would otherwise read as "100% done").
 *
 * Set to 2 for now (product decision, while the pool of approved experts is
 * still small) — raise this back up as more experts come on board.
 */
export const MIN_EVALUATORS_FOR_ASSESSMENT = 2

export type ExpertStatusTone = 'completed' | 'inProgress' | 'pending' | 'unrated'

/**
 * The four-state badge shown on each action card (methodology panel's own
 * bands: 90–100 / 11–89 / 0–10, plus "not yet assessable" below the rater
 * threshold). This is the SINGLE source of truth for that boundary — both
 * the visible badge (ChecklistActionCard) and the headline/milestone/pillar
 * math below defer to it, so the number on screen and the badge color can
 * never disagree.
 */
export function expertStatusTone(aggregate: EvaluationAggregate | undefined): ExpertStatusTone {
  if (!aggregate || aggregate.evaluatorCount < MIN_EVALUATORS_FOR_ASSESSMENT) return 'unrated'
  if (aggregate.completionPct >= 90) return 'completed'
  if (aggregate.completionPct >= 11) return 'inProgress'
  return 'pending'
}

/**
 * An item's contribution to any rollup: 0 if unrated OR under the rater
 * threshold (same "unrated" tone as expertStatusTone), otherwise its real
 * expert-assessed completionPct.
 */
function ratedItemPct(aggregate: EvaluationAggregate | undefined): number {
  return expertStatusTone(aggregate) === 'unrated' ? 0 : (aggregate?.completionPct ?? 0)
}

/**
 * Pure rollup of the 60-action checklist into headline, per-milestone, and
 * per-pillar progress. No I/O — importable from the page, the hero, and any
 * future cron without circular deps (mirrors the exported computeStarVoting()).
 *
 * `totalEvaluators` is passed in rather than derived here: it requires a
 * distinct count across `transition_evaluations`, which (by design, per the
 * monitoring spec's privacy rules) isn't derivable from the per-action
 * aggregate view alone — see getTotalEvaluatorCount() in lib/data.ts.
 */
export function computeProgress(
  actions: TransitionAction[],
  aggregates: EvaluationAggregate[],
  totalEvaluators: number
): TransitionProgress {
  const total = actions.length
  const byId = itemPctLookup(aggregates)
  const itemPct = (id: string) => ratedItemPct(byId.get(id))
  const itemEvaluatorCount = (id: string) => byId.get(id)?.evaluatorCount ?? 0

  // Secondary annotation-layer tallies (admin status), unchanged in meaning
  // from the pre-expert version — they no longer compute any percentage.
  const completed = actions.filter(a => a.status === 'completed').length
  const inProgress = actions.filter(a => a.status === 'in_progress').length
  const stalled = actions.filter(a => a.status === 'stalled').length
  const pending = actions.filter(a => a.status === 'pending').length

  const completionPct =
    total > 0 ? Math.round(actions.reduce((sum, a) => sum + itemPct(a.id), 0) / total) : 0

  const phases: PhaseProgress[] = []
  let activeAssigned = false
  for (const def of TRANSITION_PHASES) {
    const phaseActions = actions.filter(a => phaseForMonth(a.month) === def.phase)
    const pTotal = phaseActions.length
    const pCompletionPct =
      pTotal > 0
        ? Math.round(phaseActions.reduce((sum, a) => sum + itemPct(a.id), 0) / pTotal)
        : 0
    // Best available proxy for "distinct experts who rated this milestone":
    // the max evaluator count among its member actions. A true distinct count
    // would need evaluator identity, which the public aggregate view
    // deliberately never exposes (see EvaluationAggregate).
    const pEvaluatorCount = phaseActions.reduce(
      (max, a) => Math.max(max, itemEvaluatorCount(a.id)),
      0
    )

    const pCompleted = phaseActions.filter(a => a.status === 'completed').length
    const pInProgress = phaseActions.filter(a => a.status === 'in_progress').length
    const pStalled = phaseActions.filter(a => a.status === 'stalled').length
    const pPending = phaseActions.filter(a => a.status === 'pending').length

    // Earliest milestone not yet fully expert-assessed as complete is active;
    // none if every milestone has reached 100%.
    const isActive = !activeAssigned && pCompletionPct < 100
    if (isActive) activeAssigned = true

    phases.push({
      phase: def.phase,
      total: pTotal,
      completionPct: pCompletionPct,
      evaluatorCount: pEvaluatorCount,
      isActive,
      completed: pCompleted,
      inProgress: pInProgress,
      stalled: pStalled,
      pending: pPending,
    })
  }

  const pillarKeys = Array.from(new Set(actions.map(a => a.pillar)))
  const pillars: PillarProgress[] = pillarKeys
    .map(pillar => {
      const pillarActions = actions.filter(a => a.pillar === pillar)
      const pTotal = pillarActions.length
      const pCompletionPct =
        pTotal > 0
          ? Math.round(pillarActions.reduce((sum, a) => sum + itemPct(a.id), 0) / pTotal)
          : 0
      const pEvaluatorCount = pillarActions.reduce(
        (max, a) => Math.max(max, itemEvaluatorCount(a.id)),
        0
      )
      const pCompleted = pillarActions.filter(a => a.status === 'completed').length
      const pInProgress = pillarActions.filter(a => a.status === 'in_progress').length
      return {
        pillar,
        total: pTotal,
        completionPct: pCompletionPct,
        evaluatorCount: pEvaluatorCount,
        completed: pCompleted,
        inProgress: pInProgress,
      }
    })
    .sort((a, b) => b.completionPct - a.completionPct || b.total - a.total)

  return {
    total,
    completionPct,
    totalEvaluators,
    phases,
    pillars,
    completed,
    inProgress,
    stalled,
    pending,
  }
}
