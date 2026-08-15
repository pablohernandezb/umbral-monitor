/**
 * Historical baseline restored from the last good daily snapshot before
 * `expert_submissions` / `public_submissions` were accidentally wiped by a
 * stray `npm run seed` run against production on 2026-08-13 ~19:57 UTC.
 *
 * These numbers are NOT fabricated — they are copied verbatim from the
 * `star_voting_snapshots` / `submission_averages_snapshots` rows dated
 * 2026-08-13 (created 14:29 UTC, hours before the wipe), which the seed
 * script never touches since it only clears expert_submissions/
 * public_submissions themselves, not their derived daily snapshots.
 *
 * computeStarVoting() and computeSubmissionAverages() (lib/data.ts) fold
 * this baseline into every future computation — live page loads and the
 * daily analytics cron alike — so new submissions dilute it exactly as if
 * the incident had never happened, rather than the count restarting at zero.
 */

export interface StarVotingBaseline {
  scores: Record<number, number> // round-1 total scores per scenario
  finalist1: number | null
  finalist2: number | null
  finalist1Votes: number
  finalist2Votes: number
  noPreferenceVotes: number
  totalVoters: number
}

export interface AveragesBaseline {
  count: number
  averages: Record<number, number>
}

export const EXPERT_STAR_BASELINE: StarVotingBaseline = {
  scores: { 1: 106, 2: 124, 3: 153, 4: 134, 5: 126 },
  finalist1: 3,
  finalist2: 4,
  finalist1Votes: 21,
  finalist2Votes: 10,
  noPreferenceVotes: 12,
  totalVoters: 43,
}

export const PUBLIC_STAR_BASELINE: StarVotingBaseline = {
  scores: { 1: 1450, 2: 1637, 3: 1557, 4: 1738, 5: 2445 },
  finalist1: 5,
  finalist2: 4,
  finalist1Votes: 377,
  finalist2Votes: 101,
  noPreferenceVotes: 106,
  totalVoters: 584,
}

export const EXPERT_AVERAGES_BASELINE: AveragesBaseline = {
  count: 43,
  averages: {
    1: 2.4651162790697674,
    2: 2.883720930232558,
    3: 3.558139534883721,
    4: 3.116279069767442,
    5: 2.9302325581395348,
  },
}

export const PUBLIC_AVERAGES_BASELINE: AveragesBaseline = {
  count: 584,
  averages: {
    1: 2.482876712328767,
    2: 2.8030821917808217,
    3: 2.666095890410959,
    4: 2.9760273972602738,
    5: 4.186643835616438,
  },
}
