import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { computeStarVoting, computeSubmissionAverages } from '@/lib/data'
import {
  EXPERT_STAR_BASELINE,
  PUBLIC_STAR_BASELINE,
  EXPERT_AVERAGES_BASELINE,
  PUBLIC_AVERAGES_BASELINE,
} from '@/data/submission-baseline'

/**
 * GET /api/analytics/snapshot
 *
 * Cron endpoint — computes and stores daily snapshots of:
 *   1. STAR voting consensus results (star_voting_snapshots)
 *   2. Per-scenario submission averages (submission_averages_snapshots)
 *
 * Protected by CRON_SECRET. Runs daily at 14:00 UTC via vercel.json.
 */

export const maxDuration = 60

export async function GET(request: Request) {
  // Verify authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const querySecret = searchParams.get('secret')

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const db = createAdminClient()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    type SubmissionRow = {
      email: string
      scenario_probabilities: Record<number, number> | null
      submitted_at: string
    }

    // Fetch approved expert and all public submissions in parallel
    const [expertRes, publicRes] = await Promise.all([
      db
        .from('expert_submissions')
        .select('email, scenario_probabilities, submitted_at')
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false }),
      db
        .from('public_submissions')
        .select('email, scenario_probabilities, submitted_at')
        .order('submitted_at', { ascending: false }),
    ])

    // Deduplicate — keep latest submission per email
    function dedupeByEmail(rows: SubmissionRow[]): SubmissionRow[] {
      const seen = new Set<string>()
      const result: SubmissionRow[] = []
      for (const row of rows) {
        const email = row.email.toLowerCase()
        if (!seen.has(email)) { seen.add(email); result.push(row) }
      }
      return result
    }

    const expertRows = dedupeByEmail((expertRes.data || []) as SubmissionRow[])
    const publicRows = dedupeByEmail((publicRes.data || []) as SubmissionRow[])

    // ── 1. STAR voting snapshot ──────────────────────────────
    // Both blend in the recovered pre-incident baseline (see
    // data/submission-baseline.ts) so the daily snapshot never regresses
    // back to only counting rows in the live tables.
    const expertStar = computeStarVoting(expertRows, EXPERT_STAR_BASELINE)
    const publicStar = computeStarVoting(publicRows, PUBLIC_STAR_BASELINE)

    const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'

    const starRow = {
      date: today,
      expert_winner:              expertStar.winner,
      expert_finalist1:           expertStar.finalist1,
      expert_finalist2:           expertStar.finalist2,
      expert_finalist1_votes:     expertStar.finalist1Votes,
      expert_finalist2_votes:     expertStar.finalist2Votes,
      expert_no_preference_votes: expertStar.noPreferenceVotes,
      expert_total_voters:        expertStar.totalVoters,
      expert_scores:              expertStar.scores,
      public_winner:              publicStar.winner,
      public_finalist1:           publicStar.finalist1,
      public_finalist2:           publicStar.finalist2,
      public_finalist1_votes:     publicStar.finalist1Votes,
      public_finalist2_votes:     publicStar.finalist2Votes,
      public_no_preference_votes: publicStar.noPreferenceVotes,
      public_total_voters:        publicStar.totalVoters,
      public_scores:              publicStar.scores,
    }

    // ── 2. Averages snapshot ─────────────────────────────────
    // Shares computeSubmissionAverages() with getSubmissionAverages() (lib/data.ts)
    // rather than keeping a second copy of the same formula in sync by hand.
    const avgsRow = {
      date:            today,
      expert_averages: computeSubmissionAverages(expertRows, EXPERT_AVERAGES_BASELINE),
      public_averages: computeSubmissionAverages(publicRows, PUBLIC_AVERAGES_BASELINE),
      expert_count:    EXPERT_AVERAGES_BASELINE.count + expertRows.length,
      public_count:    PUBLIC_AVERAGES_BASELINE.count + publicRows.length,
    }

    // ── 3. Upsert both tables ────────────────────────────────
    const [starUpsert, avgsUpsert] = await Promise.all([
      db.from('star_voting_snapshots').upsert(starRow, { onConflict: 'date' }),
      db.from('submission_averages_snapshots').upsert(avgsRow, { onConflict: 'date' }),
    ])

    if (starUpsert.error || avgsUpsert.error) {
      return NextResponse.json({
        error: starUpsert.error?.message || avgsUpsert.error?.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      date: today,
      expertParticipants: avgsRow.expert_count,
      publicParticipants: avgsRow.public_count,
      expertWinner: expertStar.winner,
      publicWinner: publicStar.winner,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
