// The 3 live countdown targets shown on the tracker page and hero.
// Distinct from the 6 roadmap milestones in transition-phases.ts — see the
// terminology note there. Dates are absolute UTC instants so the countdown is
// deterministic regardless of viewer timezone; adjust here if a date changes.

export interface TransitionMilestone {
  id: string        // i18n key stem: installingDemocracy.milestones.<id>
  targetIso: string // absolute instant
}

export const TRANSITION_MILESTONES: TransitionMilestone[] = [
  // US midterms — Tue Nov 3, 2026, midnight US Eastern
  { id: 'usMidterms', targetIso: '2026-11-03T05:00:00Z' },
  // Negotiation table (AN-2015 <-> Interim Gov) ends — end of Dec 31, 2026,
  // i.e. midnight Jan 1, 2027 Venezuela time (UTC-4). Deliberately :00 seconds
  // rather than 23:59:59 — a target landing on :59 makes this countdown's
  // seconds display permanently 1 behind the other two, which reads as a bug.
  { id: 'negotiationEnd', targetIso: '2027-01-01T04:00:00Z' },
  // End of 18-month roadmap — Aug 1, 2026 + 18 months = Feb 1, 2028, 00:00 Venezuela time (UTC-4)
  { id: 'transitionEnd', targetIso: '2028-02-01T04:00:00Z' },
]
