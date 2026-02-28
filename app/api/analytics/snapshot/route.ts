import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { computeStarVoting } from '@/lib/data'

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
    const expertStar = computeStarVoting(expertRows)
    const publicStar = computeStarVoting(publicRows)

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
    function computeAverages(
      rows: SubmissionRow[]
    ): Record<number, number> {
      const result: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      if (rows.length === 0) return result
      for (let s = 1; s <= 5; s++) {
        const values = rows
          .map(r => r.scenario_probabilities?.[s])
          .filter((v): v is number => typeof v === 'number' && v > 0)
        result[s] = values.length > 0
          ? values.reduce((a, b) => a + b, 0) / values.length
          : 0
      }
      return result
    }

    const avgsRow = {
      date:            today,
      expert_averages: computeAverages(expertRows),
      public_averages: computeAverages(publicRows),
      expert_count:    expertRows.length,
      public_count:    publicRows.length,
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
      expertParticipants: expertRows.length,
      publicParticipants:  publicRows.length,
      expertWinner: expertStar.winner,
      publicWinner: publicStar.winner,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
