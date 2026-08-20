'use server'

import crypto from 'crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { IS_MOCK_MODE } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-server'
import type { EvaluationMap, CommentMap } from '@/types'

const MAX_COMMENT_LENGTH = 2000

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// ============================================================
// Best-effort rate limiting on code-validation attempts.
//
// Process-local (resets on redeploy/cold start) — there's no shared store in
// this deployment. A 20-char code over a 31-symbol alphabet is ~99 bits, so
// brute force is infeasible regardless of this limiter; it only blunts
// naive scripted guessing. Never differentiate "wrong code" from "not yet
// approved" — every failure path below returns the same generic `{ ok: false }`.
// ============================================================
const ATTEMPTS = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 10

async function getIpHash(): Promise<string> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  const salt = process.env.MONITOR_SALT || 'umbral-monitor-salt'
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 32)
}

async function isRateLimited(): Promise<boolean> {
  const key = await getIpHash()
  const now = Date.now()
  const entry = ATTEMPTS.get(key)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ATTEMPTS.set(key, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS
}

// ============================================================
// NEW PARTICIPANT — application submission (§7)
// ============================================================

export async function submitMonitoringApplication(input: {
  name: string
  email: string
  institution: string
}): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const institution = input.institution.trim()

  if (!name || !institution) {
    return { ok: false, error: 'missing_fields' }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, error: 'invalid_email' }
  }

  if (IS_MOCK_MODE) {
    // No persistent expert store in mock mode: the confirmation screen is
    // fully exercisable, but there is nothing here for an admin to approve.
    return { ok: true }
  }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false, error: 'unavailable' }

  const { data: existing } = await supabase
    .from('monitoring_experts')
    .select('id, status')
    .eq('email', email) // already lowercased; matches the lower(email) unique index
    .maybeSingle()

  if (existing) {
    if (existing.status === 'pending') return { ok: false, error: 'already_pending' }
    if (existing.status === 'approved') return { ok: false, error: 'already_approved' }

    // status === 'rejected': re-apply resets the SAME row to pending rather
    // than accumulating duplicate applications for one person (product
    // decision — a rejection isn't permanent, and the admin should see one
    // history per applicant, not a pile of rows).
    const { error } = await supabase
      .from('monitoring_experts')
      .update({
        name,
        institution,
        status: 'pending',
        admin_note: null,
        access_code: null,
        approved_at: null,
      })
      .eq('id', existing.id)
    if (error) return { ok: false, error: 'db_error' }

    revalidatePath('/admin/installing-democracy/experts')
    return { ok: true }
  }

  const { error } = await supabase
    .from('monitoring_experts')
    .insert({ name, email, institution, status: 'pending' })
  if (error) return { ok: false, error: 'db_error' }

  revalidatePath('/admin/installing-democracy/experts')
  return { ok: true }
}

// ============================================================
// RETURNING EXPERT — access-code gated evaluation (§8)
// ============================================================

type ValidateResult = { ok: true; evaluatorId: string } | { ok: false }

export async function validateAccessCode(code: string): Promise<ValidateResult> {
  if (await isRateLimited()) return { ok: false }

  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return { ok: false }

  if (IS_MOCK_MODE) {
    // No persistent expert store in mock mode, so no code can ever validate
    // — consistent with the 0% mock completion state: nothing can be
    // evaluated without a real, admin-approved expert behind it.
    return { ok: false }
  }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false }

  const { data } = await supabase
    .from('monitoring_experts')
    .select('id')
    .eq('access_code', trimmed)
    .eq('status', 'approved')
    .maybeSingle()

  if (!data) return { ok: false }
  return { ok: true, evaluatorId: data.id as string }
}

export async function getMyEvaluations(
  code: string
): Promise<{ ok: true; evaluations: EvaluationMap } | { ok: false }> {
  const result = await validateAccessCode(code)
  if (!result.ok) return { ok: false }

  if (IS_MOCK_MODE) return { ok: true, evaluations: {} }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false }

  const { data, error } = await supabase
    .from('transition_evaluations')
    .select('action_id, score')
    .eq('evaluator_id', result.evaluatorId)

  if (error || !data) return { ok: false }

  const evaluations: EvaluationMap = {}
  for (const row of data as { action_id: string; score: number }[]) {
    evaluations[row.action_id] = row.score
  }
  return { ok: true, evaluations }
}

export async function saveEvaluations(
  code: string,
  evaluations: EvaluationMap,
  /** Action ids the expert explicitly un-selected back to "not evaluated" —
   * these need a real DELETE, since simply omitting a key from `evaluations`
   * only means "untouched this session," not "remove my prior rating." */
  clearedActionIds: string[] = []
): Promise<{ ok: boolean; savedCount?: number; clearedCount?: number; error?: string }> {
  const result = await validateAccessCode(code)
  if (!result.ok) return { ok: false, error: 'invalid_code' }

  // Only write well-formed scores — an unset/undefined item is simply
  // omitted, never written, so partial save never clobbers untouched actions.
  const entries = Object.entries(evaluations).filter(
    ([, score]) => Number.isInteger(score) && score >= 0 && score <= 4
  )
  // Defensive: never delete something that was also just (re-)rated in the
  // same save — `evaluations` wins if an id somehow ends up in both lists.
  const toClear = Array.from(new Set(clearedActionIds)).filter(id => !(id in evaluations))

  if (entries.length === 0 && toClear.length === 0) {
    return { ok: true, savedCount: 0, clearedCount: 0 }
  }

  if (IS_MOCK_MODE) {
    // No persistent store: the save round-trip succeeds so the form's UX is
    // fully exercisable, but nothing is retained across requests.
    return { ok: true, savedCount: entries.length, clearedCount: toClear.length }
  }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false, error: 'unavailable' }

  if (toClear.length > 0) {
    const { error: clearError } = await supabase
      .from('transition_evaluations')
      .delete()
      .eq('evaluator_id', result.evaluatorId)
      .in('action_id', toClear)
    if (clearError) return { ok: false, error: 'db_error' }
  }

  if (entries.length > 0) {
    const rows = entries.map(([actionId, score]) => ({
      evaluator_id: result.evaluatorId,
      action_id: actionId,
      score,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('transition_evaluations')
      .upsert(rows, { onConflict: 'evaluator_id,action_id' })
    if (error) return { ok: false, error: 'db_error' }
  }

  revalidatePath('/installing-democracy')
  revalidatePath('/')
  return { ok: true, savedCount: entries.length, clearedCount: toClear.length }
}

// ============================================================
// COMMENTS — one private note per (expert, action) (§ comment system)
//
// Never public, never shared with other experts — same no-anon-policy
// treatment as monitoring_experts and transition_evaluations. Instant save:
// each add/edit/delete is its own round trip, independent of "Save progress".
// ============================================================

export async function getMyComments(
  code: string
): Promise<{ ok: true; comments: CommentMap } | { ok: false }> {
  const result = await validateAccessCode(code)
  if (!result.ok) return { ok: false }

  if (IS_MOCK_MODE) return { ok: true, comments: {} }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false }

  const { data, error } = await supabase
    .from('transition_comments')
    .select('action_id, body')
    .eq('evaluator_id', result.evaluatorId)

  if (error || !data) return { ok: false }

  const comments: CommentMap = {}
  for (const row of data as { action_id: string; body: string }[]) {
    comments[row.action_id] = row.body
  }
  return { ok: true, comments }
}

export async function saveComment(
  code: string,
  actionId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await validateAccessCode(code)
  if (!result.ok) return { ok: false, error: 'invalid_code' }

  const trimmed = body.trim()
  if (!trimmed) return { ok: false, error: 'empty' }
  if (trimmed.length > MAX_COMMENT_LENGTH) return { ok: false, error: 'too_long' }

  if (IS_MOCK_MODE) {
    // No persistent store: the save round-trip succeeds so the form's UX is
    // fully exercisable, but nothing is retained across requests.
    return { ok: true }
  }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false, error: 'unavailable' }

  const { error } = await supabase.from('transition_comments').upsert(
    {
      evaluator_id: result.evaluatorId,
      action_id: actionId,
      body: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'evaluator_id,action_id' }
  )
  if (error) return { ok: false, error: 'db_error' }

  return { ok: true }
}

export async function deleteComment(code: string, actionId: string): Promise<{ ok: boolean; error?: string }> {
  const result = await validateAccessCode(code)
  if (!result.ok) return { ok: false, error: 'invalid_code' }

  if (IS_MOCK_MODE) return { ok: true }

  const supabase = createAdminClient()
  if (!supabase) return { ok: false, error: 'unavailable' }

  const { error } = await supabase
    .from('transition_comments')
    .delete()
    .eq('evaluator_id', result.evaluatorId)
    .eq('action_id', actionId)
  if (error) return { ok: false, error: 'db_error' }

  return { ok: true }
}
