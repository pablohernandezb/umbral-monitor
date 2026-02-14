'use server'

import { supabase, IS_MOCK_MODE } from '@/lib/supabase'
import type { ExpertSubmission, PublicSubmission } from '@/types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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
  if (!EMAIL_REGEX.test(data.email)) {
    return { data: null, error: 'Invalid email format' }
  }

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
      email: data.email.toLowerCase(),
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
  scenario_probabilities: Record<number, number>
}): Promise<{ data: PublicSubmission | null; error: string | null }> {
  if (!EMAIL_REGEX.test(data.email)) {
    return { data: null, error: 'Invalid email format' }
  }

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
      email: data.email.toLowerCase(),
      scenario_probabilities: data.scenario_probabilities,
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
// Searches expert_submissions first, then public_submissions
// ============================================================

export type LookupResult =
  | { type: 'expert'; data: ExpertSubmission }
  | { type: 'public'; data: PublicSubmission }
  | null

export async function lookupSubmissionAction(
  email: string
): Promise<{ data: LookupResult; error: string | null }> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: null, error: null }
  }

  const emailLower = email.toLowerCase()

  // Search expert submissions first (only approved)
  const { data: expert, error: expertErr } = await supabase
    .from('expert_submissions')
    .select('*')
    .eq('email', emailLower)
    .eq('status', 'approved')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (expert) {
    return {
      data: { type: 'expert', data: expert as ExpertSubmission },
      error: null,
    }
  }

  // Then search public submissions
  const { data: pub, error: pubErr } = await supabase
    .from('public_submissions')
    .select('*')
    .eq('email', emailLower)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pub) {
    return {
      data: { type: 'public', data: pub as PublicSubmission },
      error: null,
    }
  }

  return {
    data: null,
    error: expertErr?.message || pubErr?.message || null,
  }
}
