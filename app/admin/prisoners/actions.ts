'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'
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
    .order('data_date', { ascending: false })

  // Map database column names to TypeScript field names
  const mappedData = data?.map(item => ({
    id: item.id,
    date: item.data_date,
    total_count: item.total_count,
    released: item.releases_30d,
    civilians: item.civilians,
    military: item.military,
    men: item.men,
    women: item.women,
    adults: item.adults,
    minors: item.minors,
    foreign: item.foreign,
    unknown: item.unknown,
    source: item.source,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })) || null

  return {
    data: mappedData as PoliticalPrisoner[] | null,
    error: error?.message || null
  }
}

export async function createPrisonerStatsAction(
  prisonerData: Omit<PoliticalPrisoner, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  // Map TypeScript field names to database column names
  const dbData = {
    total_count: prisonerData.total_count,
    releases_30d: prisonerData.releases_30d,
    data_date: prisonerData.date,
    civilians: prisonerData.civilians,
    military: prisonerData.military,
    men: prisonerData.men,
    women: prisonerData.women,
    adults: prisonerData.adults,
    minors: prisonerData.minors,
    foreign: prisonerData.foreign,
    unknown: prisonerData.unknown,
    source: prisonerData.source,
  }

  const { data, error } = await supabase
    .from('political_prisoners')
    .insert(dbData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  // Map database column names back to TypeScript field names
  const mappedData = data ? {
    id: data.id,
    date: data.data_date,
    total: data.total_count,
    released: data.releases_30d,
    civilians: data.civilians,
    military: data.military,
    men: data.men,
    women: data.women,
    adults: data.adults,
    minors: data.minors,
    foreign: data.foreign,
    unknown: data.unknown,
    source: data.source,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } : null

  return {
    data: mappedData as PoliticalPrisoner | null,
    error: error?.message || null
  }
}

export async function updatePrisonerStatsAction(
  id: string,
  prisonerData: Partial<Omit<PoliticalPrisoner, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  // Map TypeScript field names to database column names
  const dbData: Record<string, any> = {}
  if (prisonerData.total_count !== undefined) dbData.total_count = prisonerData.total_count
  if (prisonerData.releases_30d !== undefined) dbData.releases_30d = prisonerData.releases_30d
  if (prisonerData.date !== undefined) dbData.data_date = prisonerData.date
  if (prisonerData.civilians !== undefined) dbData.civilians = prisonerData.civilians
  if (prisonerData.military !== undefined) dbData.military = prisonerData.military
  if (prisonerData.men !== undefined) dbData.men = prisonerData.men
  if (prisonerData.women !== undefined) dbData.women = prisonerData.women
  if (prisonerData.adults !== undefined) dbData.adults = prisonerData.adults
  if (prisonerData.minors !== undefined) dbData.minors = prisonerData.minors
  if (prisonerData.foreign !== undefined) dbData.foreign = prisonerData.foreign
  if (prisonerData.unknown !== undefined) dbData.unknown = prisonerData.unknown
  if (prisonerData.source !== undefined) dbData.source = prisonerData.source

  const { data, error } = await supabase
    .from('political_prisoners')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  // Map database column names back to TypeScript field names
  const mappedData = data ? {
    id: data.id,
    date: data.data_date,
    total: data.total_count,
    released: data.releases_30d,
    civilians: data.civilians,
    military: data.military,
    men: data.men,
    women: data.women,
    adults: data.adults,
    minors: data.minors,
    foreign: data.foreign,
    unknown: data.unknown,
    source: data.source,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } : null

  return {
    data: mappedData as PoliticalPrisoner | null,
    error: error?.message || null
  }
}

export async function deletePrisonerStatsAction(id: string) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
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
    .order('data_date', { ascending: false })

  // Map database column names to TypeScript field names
  const mappedData = data?.map(item => ({
    id: item.id,
    organization: item.organization,
    count: item.count,
    date: item.data_date,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })) || null

  return {
    data: mappedData as PrisonersByOrganization[] | null,
    error: error?.message || null
  }
}

export async function createPrisonerByOrgAction(
  orgData: Omit<PrisonersByOrganization, 'id' | 'created_at' | 'updated_at'>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  // Map TypeScript field names to database column names
  const dbData = {
    organization: orgData.organization,
    count: orgData.count,
    data_date: orgData.date,
  }

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .insert(dbData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  // Map database column names back to TypeScript field names
  const mappedData = data ? {
    id: data.id,
    organization: data.organization,
    count: data.count,
    date: data.data_date,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } : null

  return {
    data: mappedData as PrisonersByOrganization | null,
    error: error?.message || null
  }
}

export async function updatePrisonerByOrgAction(
  id: string,
  orgData: Partial<Omit<PrisonersByOrganization, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  // Map TypeScript field names to database column names
  const dbData: Record<string, any> = {}
  if (orgData.organization !== undefined) dbData.organization = orgData.organization
  if (orgData.count !== undefined) dbData.count = orgData.count
  if (orgData.date !== undefined) dbData.data_date = orgData.date

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .update(dbData)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/prisoners')
  }

  // Map database column names back to TypeScript field names
  const mappedData = data ? {
    id: data.id,
    organization: data.organization,
    count: data.count,
    date: data.data_date,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } : null

  return {
    data: mappedData as PrisonersByOrganization | null,
    error: error?.message || null
  }
}

export async function deletePrisonerByOrgAction(id: string) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
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
