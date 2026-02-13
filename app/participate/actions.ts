'use server'

import { supabase, IS_MOCK_MODE } from '@/lib/supabase'
import type { ExpertSubmission, PublicSubmission } from '@/types'

// ============================================================
// EXPERT SUBMISSION (public insert — no auth required)
// ============================================================

export async function submitExpertAction(data: {
  name: string
  email: string
  institution: string
  ideology_score: number
  scenario_probabilities: Record<number, number>
}): Promise<{ data: ExpertSubmission | null; error: string | null }> {
  if (IS_MOCK_MODE || !supabase) {
    // Mock mode: return a fake record so the UI flow completes
    return {
      data: {
        id: crypto.randomUUID(),
        ...data,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        created_at: new Date().toISOString(),
      },
      error: null,
    }
  }

  const { data: result, error } = await supabase
    .from('expert_submissions')
    .insert({
      name: data.name,
      email: data.email,
      institution: data.institution,
      ideology_score: data.ideology_score,
      scenario_probabilities: data.scenario_probabilities,
      status: 'pending',
    })
    .select()
    .single()

  return {
    data: result as ExpertSubmission | null,
    error: error?.message || null,
  }
}

// ============================================================
// PUBLIC SUBMISSION (public insert — no auth required)
// ============================================================

export async function submitPublicAction(data: {
  email: string
  resolved_scenario: number
  path: boolean[]
}): Promise<{ data: PublicSubmission | null; error: string | null }> {
  if (IS_MOCK_MODE || !supabase) {
    return {
      data: {
        id: crypto.randomUUID(),
        ...data,
        status: 'published',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      error: null,
    }
  }

  const { data: result, error } = await supabase
    .from('public_submissions')
    .insert({
      email: data.email,
      resolved_scenario: data.resolved_scenario,
      path: data.path,
      status: 'published',
    })
    .select()
    .single()

  return {
    data: result as PublicSubmission | null,
    error: error?.message || null,
  }
}

// ============================================================
// LOOKUP SUBMISSION (public read — for returning participants)
// ============================================================

export async function lookupSubmissionAction(
  email: string
): Promise<{ data: PublicSubmission | null; error: string | null }> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('public_submissions')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    data: data as PublicSubmission | null,
    error: error?.message || null,
  }
}
