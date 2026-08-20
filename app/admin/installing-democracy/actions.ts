'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { MOCK_TRANSITION_CHECKLIST } from '@/data/mock'
import type { TransitionAction, TransitionSource, TransitionStatus } from '@/types'

interface TransitionChecklistDbRow {
  id: string
  pillar: string
  month: number
  sort_order: number
  action_es: string
  action_en: string
  indicator_es: string
  indicator_en: string
  responsible_es: string
  responsible_en: string
  actors: string[]
  status: TransitionStatus
  evidence_es: string | null
  evidence_en: string | null
  sources: TransitionSource[]
  completed_date: string | null
  is_alert?: boolean
}

function mapRow(row: TransitionChecklistDbRow): TransitionAction {
  return {
    id: row.id,
    pillar: row.pillar,
    month: row.month,
    sortOrder: row.sort_order,
    actionEs: row.action_es,
    actionEn: row.action_en,
    indicatorEs: row.indicator_es,
    indicatorEn: row.indicator_en,
    responsibleEs: row.responsible_es,
    responsibleEn: row.responsible_en,
    actors: row.actors ?? [],
    status: row.status,
    evidenceEs: row.evidence_es,
    evidenceEn: row.evidence_en,
    sources: row.sources ?? [],
    completedDate: row.completed_date,
    isAlert: row.is_alert ?? false,
  }
}

export async function getAllTransitionActions() {
  const supabase = await createClient()

  if (!supabase) {
    const sorted = [...MOCK_TRANSITION_CHECKLIST].sort((a, b) => a.sortOrder - b.sortOrder)
    return { data: sorted, error: null }
  }

  const { data, error } = await supabase
    .from('transition_checklist')
    .select('*')
    .order('sort_order', { ascending: true })

  return {
    data: data ? (data as TransitionChecklistDbRow[]).map(mapRow) : null,
    error: error?.message || null,
  }
}

export interface TransitionActionPatch {
  status?: TransitionStatus
  evidenceEs?: string | null
  evidenceEn?: string | null
  sources?: TransitionSource[]
  completedDate?: string | null
  /** Purely presentational red pulse/tilt on the public card — no percentage,
   * badge, or rollup reads this. */
  isAlert?: boolean
}

export async function updateTransitionActionAdmin(id: string, patch: TransitionActionPatch) {
  const supabase = createAdminClient()

  if (!supabase) {
    // Mock mode: return success, client manages local state
    return { data: null, error: null }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status !== undefined) update.status = patch.status
  if (patch.evidenceEs !== undefined) update.evidence_es = patch.evidenceEs
  if (patch.evidenceEn !== undefined) update.evidence_en = patch.evidenceEn
  if (patch.sources !== undefined) update.sources = patch.sources
  if (patch.isAlert !== undefined) update.is_alert = patch.isAlert

  // On setting status to 'completed' with no completedDate given, default it to
  // today. Moving off 'completed' leaves completedDate as the admin sets it —
  // never silently wiped.
  if (patch.completedDate !== undefined) {
    update.completed_date = patch.completedDate
  } else if (patch.status === 'completed') {
    update.completed_date = new Date().toISOString().slice(0, 10)
  }

  const { data, error } = await supabase
    .from('transition_checklist')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/installing-democracy')
    revalidatePath('/installing-democracy')
    revalidatePath('/')
  }

  return {
    data: data ? mapRow(data as TransitionChecklistDbRow) : null,
    error: error?.message || null,
  }
}

// ============================================================
// EXPERT COMMENTS — admin moderation view
// Private between experts (see participate/actions.ts) — the admin is the
// only party besides the commenting expert who can ever read these, via the
// service-role client only.
// ============================================================

export async function getCommentsForAction(actionId: string) {
  const supabase = createAdminClient()
  if (!supabase) {
    // Mock mode: no persistent expert/comment store to read.
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('transition_comments')
    .select('id, action_id, body, created_at, updated_at, monitoring_experts(name, email)')
    .eq('action_id', actionId)
    .order('updated_at', { ascending: false })

  if (error || !data) {
    return { data: [], error: error?.message ?? null }
  }

  type Row = {
    id: string
    action_id: string
    body: string
    created_at: string
    updated_at: string
    monitoring_experts: { name: string; email: string } | { name: string; email: string }[] | null
  }

  const comments = (data as Row[]).map(row => {
    // Supabase-js types this embed as an array for some FK shapes even though
    // the relationship is one-to-one here; normalize either shape.
    const expert = Array.isArray(row.monitoring_experts) ? row.monitoring_experts[0] : row.monitoring_experts
    return {
      id: row.id,
      actionId: row.action_id,
      evaluatorName: expert?.name ?? 'Unknown',
      evaluatorEmail: expert?.email ?? '',
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })

  return { data: comments, error: null }
}

export async function adminDeleteComment(commentId: string) {
  const supabase = createAdminClient()
  if (!supabase) return { error: null }

  const { error } = await supabase.from('transition_comments').delete().eq('id', commentId)
  return { error: error?.message ?? null }
}
