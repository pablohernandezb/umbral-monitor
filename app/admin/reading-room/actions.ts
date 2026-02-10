'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
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
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('reading_room')
    .insert(itemData)
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
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('reading_room')
    .update(itemData)
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
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
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
