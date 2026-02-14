'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import type { ExpertSubmission, PublicSubmission } from '@/types'

// ============================================================
// MOCK DATA (used until Supabase tables are created)
// ============================================================

const MOCK_EXPERT_SUBMISSIONS: ExpertSubmission[] = [
  {
    id: 'EXP-20260210-001',
    name: 'Dr. María González',
    email: 'mgonzalez@ucv.edu.ve',
    institution: 'Universidad Central de Venezuela',
    ideology_score: 4,
    scenario_probabilities: { 1: 2, 2: 3, 3: 4, 4: 3, 5: 2 },
    status: 'pending',
    submitted_at: '2026-02-10T14:30:00Z',
    reviewed_at: null,
    created_at: '2026-02-10T14:30:00Z',
  },
  {
    id: 'EXP-20260211-002',
    name: 'Prof. James Mitchell',
    email: 'jmitchell@georgetown.edu',
    institution: 'Georgetown University',
    ideology_score: 6,
    scenario_probabilities: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 3 },
    status: 'pending',
    submitted_at: '2026-02-11T09:15:00Z',
    reviewed_at: null,
    created_at: '2026-02-11T09:15:00Z',
  },
  {
    id: 'EXP-20260211-003',
    name: 'Dr. Ana Palacios',
    email: 'apalacios@usb.ve',
    institution: 'Universidad Simón Bolívar',
    ideology_score: 3,
    scenario_probabilities: { 1: 3, 2: 4, 3: 3, 4: 2, 5: 1 },
    status: 'approved',
    submitted_at: '2026-02-11T16:45:00Z',
    reviewed_at: '2026-02-11T17:00:00Z',
    created_at: '2026-02-11T16:45:00Z',
  },
]

const MOCK_PUBLIC_SUBMISSIONS: PublicSubmission[] = [
  { id: 'PUB-20260210-001', email: 'ciudadano1@gmail.com', scenario_probabilities: { 1: 3, 2: 4, 3: 2, 4: 1, 5: 1 }, status: 'published', submitted_at: '2026-02-10T10:20:00Z', created_at: '2026-02-10T10:20:00Z' },
  { id: 'PUB-20260211-002', email: 'observer@outlook.com', scenario_probabilities: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 3 }, status: 'published', submitted_at: '2026-02-11T11:30:00Z', created_at: '2026-02-11T11:30:00Z' },
  { id: 'PUB-20260212-003', email: 'watcher@proton.me', scenario_probabilities: { 1: 5, 2: 4, 3: 2, 4: 1, 5: 1 }, status: 'published', submitted_at: '2026-02-12T08:00:00Z', created_at: '2026-02-12T08:00:00Z' },
  { id: 'PUB-20260212-004', email: 'analista@gmail.com', scenario_probabilities: { 1: 1, 2: 1, 3: 2, 4: 3, 5: 5 }, status: 'published', submitted_at: '2026-02-12T12:00:00Z', created_at: '2026-02-12T12:00:00Z' },
  { id: 'PUB-20260212-005', email: 'observador2@yahoo.com', scenario_probabilities: { 1: 2, 2: 2, 3: 4, 4: 3, 5: 2 }, status: 'published', submitted_at: '2026-02-12T13:45:00Z', created_at: '2026-02-12T13:45:00Z' },
]

// ============================================================
// EXPERT SUBMISSIONS
// ============================================================

export async function getAllExpertSubmissionsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: MOCK_EXPERT_SUBMISSIONS, error: null }
  }

  const { data, error } = await supabase
    .from('expert_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })

  return {
    data: data as ExpertSubmission[] | null,
    error: error?.message || null,
  }
}

export async function updateExpertStatusAction(
  id: string,
  status: 'approved' | 'rejected'
) {
  const supabase = createAdminClient()

  if (!supabase) {
    // Mock mode: return success, client manages local state
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('expert_submissions')
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/participate')
  }

  return {
    data: data as ExpertSubmission | null,
    error: error?.message || null,
  }
}

// ============================================================
// PUBLIC SUBMISSIONS
// ============================================================

export async function getAllPublicSubmissionsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: MOCK_PUBLIC_SUBMISSIONS, error: null }
  }

  const { data, error } = await supabase
    .from('public_submissions')
    .select('*')
    .order('submitted_at', { ascending: false })

  return {
    data: data as PublicSubmission[] | null,
    error: error?.message || null,
  }
}

export async function deletePublicSubmissionAction(id: string) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: null }
  }

  const { error } = await supabase
    .from('public_submissions')
    .delete()
    .eq('id', id)

  if (!error) {
    revalidatePath('/admin/participate')
  }

  return {
    data: null,
    error: error?.message || null,
  }
}

// ============================================================
// STATS (for dashboard)
// ============================================================

export async function getParticipateStatsAction() {
  const supabase = await createClient()

  if (!supabase) {
    const pending = MOCK_EXPERT_SUBMISSIONS.filter(s => s.status === 'pending').length
    const approved = MOCK_EXPERT_SUBMISSIONS.filter(s => s.status === 'approved').length
    const rejected = MOCK_EXPERT_SUBMISSIONS.filter(s => s.status === 'rejected').length
    return {
      data: {
        totalExpert: MOCK_EXPERT_SUBMISSIONS.length,
        totalPublic: MOCK_PUBLIC_SUBMISSIONS.length,
        pendingExpert: pending,
        approvedExpert: approved,
        rejectedExpert: rejected,
      },
      error: null,
    }
  }

  const [expertRes, publicRes] = await Promise.all([
    supabase.from('expert_submissions').select('status'),
    supabase.from('public_submissions').select('id', { count: 'exact', head: true }),
  ])

  const expertData = (expertRes.data || []) as Array<{ status: string }>
  return {
    data: {
      totalExpert: expertData.length,
      totalPublic: publicRes.count || 0,
      pendingExpert: expertData.filter(e => e.status === 'pending').length,
      approvedExpert: expertData.filter(e => e.status === 'approved').length,
      rejectedExpert: expertData.filter(e => e.status === 'rejected').length,
    },
    error: expertRes.error?.message || publicRes.error?.message || null,
  }
}
