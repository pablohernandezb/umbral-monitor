'use server'

import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-server'
import type { MonitoringExpert, MonitoringStatus } from '@/types'

// 31-symbol alphabet, no 0/O/1/I/L — avoids characters an admin could
// mis-transcribe when reading the code aloud or copying it manually.
const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const ACCESS_CODE_LENGTH = 20

function generateAccessCode(): string {
  let code = ''
  for (let i = 0; i < ACCESS_CODE_LENGTH; i++) {
    code += ACCESS_CODE_ALPHABET[crypto.randomInt(ACCESS_CODE_ALPHABET.length)]
  }
  return code
}

interface MonitoringExpertRow {
  id: string
  name: string
  email: string
  institution: string
  status: MonitoringStatus
  access_code: string | null
  admin_note: string | null
  created_at: string
  approved_at: string | null
}

function mapExpert(row: MonitoringExpertRow): MonitoringExpert {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    institution: row.institution,
    status: row.status,
    accessCode: row.access_code,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  }
}

export async function listApplications(
  status?: MonitoringStatus
): Promise<{ data: MonitoringExpert[]; ratedCounts: Record<string, number>; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) {
    // Mock mode: no persistent expert store — the admin screen renders
    // empty lists rather than fabricating applicants that were never real.
    return { data: [], ratedCounts: {}, error: null }
  }

  let query = supabase.from('monitoring_experts').select('*').order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error || !data) {
    return { data: [], ratedCounts: {}, error: error?.message ?? null }
  }

  const experts = (data as MonitoringExpertRow[]).map(mapExpert)

  // Rated-count per expert (only meaningful for approved ones, but computed
  // uniformly) — a plain per-row count rather than a DB-side group-by, since
  // this list is small (vetted-expert scale, not public-scale).
  const ratedCounts: Record<string, number> = {}
  if (experts.length > 0) {
    const { data: evalRows } = await supabase
      .from('transition_evaluations')
      .select('evaluator_id')
      .in('evaluator_id', experts.map(e => e.id))
    for (const row of (evalRows ?? []) as { evaluator_id: string }[]) {
      ratedCounts[row.evaluator_id] = (ratedCounts[row.evaluator_id] ?? 0) + 1
    }
  }

  return { data: experts, ratedCounts, error: null }
}

export async function approveApplication(
  id: string
): Promise<{ data: MonitoringExpert | null; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { data: null, error: null }

  // Retry on the rare access_code uniqueness collision (20 chars over 31
  // symbols is ~99 bits, so this loop almost never iterates more than once).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAccessCode()
    const { data, error } = await supabase
      .from('monitoring_experts')
      .update({ status: 'approved', access_code: code, approved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      revalidatePath('/admin/installing-democracy/experts')
      return { data: data ? mapExpert(data as MonitoringExpertRow) : null, error: null }
    }
    // Postgres unique_violation is 23505 — anything else is a real failure.
    if (error.code !== '23505') {
      return { data: null, error: error.message }
    }
  }

  return { data: null, error: 'Could not generate a unique access code — try again.' }
}

export async function rejectApplication(id: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { error: null }

  const { error } = await supabase.from('monitoring_experts').update({ status: 'rejected' }).eq('id', id)
  if (!error) revalidatePath('/admin/installing-democracy/experts')
  return { error: error?.message ?? null }
}

export async function regenerateCode(
  id: string
): Promise<{ data: MonitoringExpert | null; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { data: null, error: null }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateAccessCode()
    const { data, error } = await supabase
      .from('monitoring_experts')
      .update({ access_code: code })
      .eq('id', id)
      .select()
      .single()

    if (!error) {
      revalidatePath('/admin/installing-democracy/experts')
      return { data: data ? mapExpert(data as MonitoringExpertRow) : null, error: null }
    }
    if (error.code !== '23505') {
      return { data: null, error: error.message }
    }
  }

  return { data: null, error: 'Could not generate a unique access code — try again.' }
}

export async function updateAdminNote(id: string, note: string): Promise<{ error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { error: null }

  const { error } = await supabase
    .from('monitoring_experts')
    .update({ admin_note: note.trim() || null })
    .eq('id', id)
  if (!error) revalidatePath('/admin/installing-democracy/experts')
  return { error: error?.message ?? null }
}

/**
 * Edit an expert's name / email / institution.
 *
 * Email needs its own duplicate check: monitoring_experts has a UNIQUE index
 * on lower(email), so editing one expert onto another's address would fail at
 * the DB with an opaque 23505. Catch it here and return a usable message
 * instead.
 */
export async function updateExpert(
  id: string,
  input: { name: string; email: string; institution: string }
): Promise<{ data: MonitoringExpert | null; error: string | null }> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const institution = input.institution.trim()

  if (!name || !institution) return { data: null, error: 'Name and institution are required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { data: null, error: 'Invalid email address.' }
  }

  const supabase = createAdminClient()
  if (!supabase) {
    // Mock mode: no persistent expert store to edit.
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('monitoring_experts')
    .update({ name, email, institution })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Another expert already uses that email address.' }
    }
    return { data: null, error: error.message }
  }

  revalidatePath('/admin/installing-democracy/experts')
  return { data: data ? mapExpert(data as MonitoringExpertRow) : null, error: null }
}

/**
 * Activity log — every "Save progress" press, newest first, joined with who
 * made it. Admin-only: transition_save_log has RLS with no anon policy, so
 * this is reachable only through the service-role client.
 */
export async function listSaveLog(limit = 100) {
  const supabase = createAdminClient()
  if (!supabase) {
    // Mock mode: no persistent store to read.
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('transition_save_log')
    .select('id, saved_count, cleared_count, scores, cleared_ids, created_at, monitoring_experts(name, email)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return { data: [], error: error?.message ?? null }
  }

  type Row = {
    id: string
    saved_count: number
    cleared_count: number
    scores: Record<string, number> | null
    cleared_ids: string[] | null
    created_at: string
    monitoring_experts: { name: string; email: string } | { name: string; email: string }[] | null
  }

  const entries = (data as Row[]).map(row => {
    // supabase-js types this embed as an array for some FK shapes even though
    // the relationship is one-to-one here; normalize either shape.
    const expert = Array.isArray(row.monitoring_experts) ? row.monitoring_experts[0] : row.monitoring_experts
    return {
      id: row.id,
      evaluatorName: expert?.name ?? 'Unknown',
      evaluatorEmail: expert?.email ?? '',
      savedCount: row.saved_count,
      clearedCount: row.cleared_count,
      scores: row.scores ?? {},
      clearedIds: row.cleared_ids ?? [],
      createdAt: row.created_at,
    }
  })

  return { data: entries, error: null }
}
