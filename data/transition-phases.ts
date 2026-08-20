// "Installing Democracy" roadmap milestones (the 6 Domino-bar segments).
//
// Terminology: these 6 roadmap MILESTONES are distinct from the 3 calendar
// COUNTDOWNS in data/transition-milestones.ts. Don't merge the two — the type
// names below intentionally differ (TransitionPhaseDef/TRANSITION_PHASES vs.
// TransitionMilestone/TRANSITION_MILESTONES).

export interface TransitionPhaseDef {
  phase: number // 1..6 (milestone number, in order)
  key: string   // i18n key stem: installingDemocracy.phases.<key>
  monthStart: number // inclusive window start (for rolling up actions)
  monthEnd: number   // inclusive window end
}

export const TRANSITION_PHASES: TransitionPhaseDef[] = [
  { phase: 1, key: 'liberties', monthStart: 1, monthEnd: 3 },              // Mes 3    — 21 actions
  { phase: 2, key: 'electoralInstitutions', monthStart: 4, monthEnd: 6 },  // Mes 6    — 14 actions
  { phase: 3, key: 'competition', monthStart: 7, monthEnd: 7 },            // Mes 7    —  2 actions
  { phase: 4, key: 'foundingElection', monthStart: 8, monthEnd: 11 },      // Mes 10–11 — 9 actions
  { phase: 5, key: 'transfer', monthStart: 12, monthEnd: 12 },             // Mes 12   —  3 actions
  { phase: 6, key: 'consolidation', monthStart: 13, monthEnd: 18 },        // Mes 18   — 11 actions
]

export function phaseForMonth(m: number): number {
  if (m <= 3) return 1
  if (m <= 6) return 2
  if (m === 7) return 3
  if (m <= 11) return 4
  if (m === 12) return 5
  return 6
}

// ============================================================
// CURRENT CALENDAR MONTH ON THE 18-MONTH ROADMAP
// ============================================================
//
// Purely calendar-based — not tied to any admin data or actual milestone
// progress. Month 1 is August 2026 (matches the transitionEnd countdown in
// data/transition-milestones.ts: Aug 1, 2026 + 18 months = Feb 1, 2028).
const ROADMAP_START_YEAR = 2026
const ROADMAP_START_MONTH = 8 // August, 1-indexed
export const ROADMAP_TOTAL_MONTHS = 18

/**
 * Which of the 18 roadmap months the calendar is currently in, clamped to
 * [1, ROADMAP_TOTAL_MONTHS] before the roadmap starts or after it ends.
 */
export function currentRoadmapMonth(now: Date = new Date()): number {
  const elapsed = (now.getFullYear() - ROADMAP_START_YEAR) * 12 + (now.getMonth() + 1 - ROADMAP_START_MONTH)
  return Math.min(ROADMAP_TOTAL_MONTHS, Math.max(1, elapsed + 1))
}
