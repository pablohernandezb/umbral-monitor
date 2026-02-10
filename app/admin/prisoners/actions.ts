'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { PoliticalPrisoner, PrisonersByOrganization } from '@/types'

// Political Prisoners Actions
export async function getAllPrisonerStatsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('political_prisoners')
    .select('*')
    .order('date', { ascending: false })

  return {
    data: data as PoliticalPrisoner[] | null,
    error: error?.message || null
  }
}

export async function createPrisonerStatsAction(
  prisonerData: Omit<PoliticalPrisoner, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('political_prisoners')
    .insert(prisonerData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  return {
    data: data as PoliticalPrisoner | null,
    error: error?.message || null
  }
}

export async function updatePrisonerStatsAction(
  id: string,
  prisonerData: Partial<Omit<PoliticalPrisoner, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('political_prisoners')
    .update(prisonerData)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  return {
    data: data as PoliticalPrisoner | null,
    error: error?.message || null
  }
}

export async function deletePrisonerStatsAction(id: string) {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { error } = await supabase
    .from('political_prisoners')
    .delete()
    .eq('id', id)

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  return {
    data: null,
    error: error?.message || null
  }
}

// Prisoners by Organization Actions
export async function getAllPrisonersByOrgAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .select('*')
    .order('date', { ascending: false })

  return {
    data: data as PrisonersByOrganization[] | null,
    error: error?.message || null
  }
}

export async function createPrisonerByOrgAction(
  orgData: Omit<PrisonersByOrganization, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .insert(orgData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  return {
    data: data as PrisonersByOrganization | null,
    error: error?.message || null
  }
}

export async function updatePrisonerByOrgAction(
  id: string,
  orgData: Partial<Omit<PrisonersByOrganization, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .update(orgData)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  return {
    data: data as PrisonersByOrganization | null,
    error: error?.message || null
  }
}

export async function deletePrisonerByOrgAction(id: string) {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { error } = await supabase
    .from('prisoners_by_organization')
    .delete()
    .eq('id', id)

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  return {
    data: null,
    error: error?.message || null
  }
}
