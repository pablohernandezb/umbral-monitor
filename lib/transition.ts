import type { TransitionAction, TransitionProgress, PhaseProgress, PillarProgress } from '@/types'
import { TRANSITION_PHASES, phaseForMonth } from '@/data/transition-phases'

export { phaseForMonth }

/** Milestone number -> i18n key stem, derived once from TRANSITION_PHASES. */
export const PHASE_KEY_BY_NUMBER: Record<number, string> = Object.fromEntries(
  TRANSITION_PHASES.map(def => [def.phase, def.key])
)

/**
 * Pure rollup of the 62-action checklist into headline, per-milestone, and
 * per-pillar progress. No I/O — importable from the page, the hero, and any
 * future cron without circular deps (mirrors the exported computeStarVoting()).
 */
export function computeProgress(actions: TransitionAction[]): TransitionProgress {
  const total = actions.length
  const completed = actions.filter(a => a.status === 'completed').length
  const inProgress = actions.filter(a => a.status === 'in_progress').length
  const stalled = actions.filter(a => a.status === 'stalled').length
  const pending = actions.filter(a => a.status === 'pending').length

  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0
  const momentumPct = total > 0 ? ((completed + 0.5 * inProgress) / total) * 100 : 0

  const phases: PhaseProgress[] = []
  let activeAssigned = false
  for (const def of TRANSITION_PHASES) {
    const phaseActions = actions.filter(a => phaseForMonth(a.month) === def.phase)
    const pTotal = phaseActions.length
    const pCompleted = phaseActions.filter(a => a.status === 'completed').length
    const pInProgress = phaseActions.filter(a => a.status === 'in_progress').length
    const pStalled = phaseActions.filter(a => a.status === 'stalled').length
    const pPending = phaseActions.filter(a => a.status === 'pending').length
    const pCompletedPct = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0
    const pMomentumPct = pTotal > 0 ? ((pCompleted + 0.5 * pInProgress) / pTotal) * 100 : 0

    // Earliest milestone whose completed < total is active; none if all complete.
    const isActive = !activeAssigned && pCompleted < pTotal
    if (isActive) activeAssigned = true

    phases.push({
      phase: def.phase,
      total: pTotal,
      completed: pCompleted,
      inProgress: pInProgress,
      stalled: pStalled,
      pending: pPending,
      completedPct: pCompletedPct,
      momentumPct: pMomentumPct,
      isActive,
    })
  }

  const pillarKeys = Array.from(new Set(actions.map(a => a.pillar)))
  const pillars: PillarProgress[] = pillarKeys
    .map(pillar => {
      const pillarActions = actions.filter(a => a.pillar === pillar)
      const pTotal = pillarActions.length
      const pCompleted = pillarActions.filter(a => a.status === 'completed').length
      const pInProgress = pillarActions.filter(a => a.status === 'in_progress').length
      const pCompletedPct = pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0
      return { pillar, total: pTotal, completed: pCompleted, inProgress: pInProgress, completedPct: pCompletedPct }
    })
    .sort((a, b) => b.completedPct - a.completedPct || b.total - a.total)

  return {
    total,
    completed,
    inProgress,
    stalled,
    pending,
    completedPct,
    momentumPct,
    phases,
    pillars,
  }
}
