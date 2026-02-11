'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import type { ReadingRoomItem } from '@/types'

export async function getAllReadingRoomItemsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('reading_room')
    .select('*')
    .order('year', { ascending: false })

  return {
    data: data as ReadingRoomItem[] | null,
    error: error?.message || null
  }
}

export async function createReadingRoomItemAction(
  itemData: Omit<ReadingRoomItem, 'id' | 'created_at'>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  // Clean the data: convert empty strings to null for optional fields
  const cleanedData = {
    ...itemData,
    title_es: itemData.title_es?.trim() || null,
    description_es: itemData.description_es?.trim() || null,
    external_url: itemData.external_url?.trim() || null,
    tags_es: itemData.tags_es && itemData.tags_es.length > 0 ? itemData.tags_es : null,
  }

  const { data, error } = await supabase
    .from('reading_room')
    .insert(cleanedData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/reading-room')
  }

  return {
    data: data as ReadingRoomItem | null,
    error: error?.message || null
  }
}

export async function updateReadingRoomItemAction(
  id: string,
  itemData: Partial<Omit<ReadingRoomItem, 'id' | 'created_at'>>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  // Clean the data: convert empty strings to null for optional fields
  const cleanedData = {
    ...itemData,
    title_es: itemData.title_es?.trim() || null,
    description_es: itemData.description_es?.trim() || null,
    external_url: itemData.external_url?.trim() || null,
    tags_es: itemData.tags_es && itemData.tags_es.length > 0 ? itemData.tags_es : null,
  }

  const { data, error } = await supabase
    .from('reading_room')
    .update(cleanedData)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/reading-room')
  }

  return {
    data: data as ReadingRoomItem | null,
    error: error?.message || null
  }
}

export async function deleteReadingRoomItemAction(id: string) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const { error } = await supabase
    .from('reading_room')
    .delete()
    .eq('id', id)

  if (!error) {
    revalidatePath('/admin/reading-room')
  }

  return {
    data: null,
    error: error?.message || null
  }
}
