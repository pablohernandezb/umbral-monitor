'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import type { GdeltEvent } from '@/types/gdelt'

export async function getAllGdeltEventsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('gdelt_events')
    .select('*')
    .order('date', { ascending: true })

  return {
    data: data as GdeltEvent[] | null,
    error: error?.message || null,
  }
}

export async function createGdeltEventAction(
  event: Omit<GdeltEvent, 'id' | 'created_at'>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const { data, error } = await supabase
    .from('gdelt_events')
    .insert(event)
    .select()
    .single()

  if (!error) revalidatePath('/admin/gdelt-events')

  return {
    data: data as GdeltEvent | null,
    error: error?.message || null,
  }
}

export async function updateGdeltEventAction(
  id: string,
  event: Partial<Omit<GdeltEvent, 'id' | 'created_at'>>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const { data, error } = await supabase
    .from('gdelt_events')
    .update(event)
    .eq('id', id)
    .select()
    .single()

  if (!error) revalidatePath('/admin/gdelt-events')

  return {
    data: data as GdeltEvent | null,
    error: error?.message || null,
  }
}

export async function deleteGdeltEventAction(id: string) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const { error } = await supabase
    .from('gdelt_events')
    .delete()
    .eq('id', id)

  if (!error) revalidatePath('/admin/gdelt-events')

  return {
    data: null,
    error: error?.message || null,
  }
}
