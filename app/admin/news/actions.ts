'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import type { NewsItem } from '@/types'

export async function getAllNewsItemsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('news_feed')
    .select('*')
    .order('published_at', { ascending: false })

  return {
    data: data as NewsItem[] | null,
    error: error?.message || null
  }
}

export async function createNewsItemAction(
  itemData: Omit<NewsItem, 'id' | 'created_at'>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const cleanedData = {
    ...itemData,
    summary_en: itemData.summary_en?.trim() || null,
    summary_es: itemData.summary_es?.trim() || null,
    votes_scenario_1: itemData.votes_scenario_1 || 0,
    votes_scenario_2: itemData.votes_scenario_2 || 0,
    votes_scenario_3: itemData.votes_scenario_3 || 0,
    votes_scenario_4: itemData.votes_scenario_4 || 0,
    votes_scenario_5: itemData.votes_scenario_5 || 0,
  }

  const { data, error } = await supabase
    .from('news_feed')
    .insert(cleanedData)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/news')
  }

  return {
    data: data as NewsItem | null,
    error: error?.message || null
  }
}

export async function updateNewsItemAction(
  id: string,
  itemData: Partial<Omit<NewsItem, 'id' | 'created_at'>>
) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const cleanedData = {
    ...itemData,
    summary_en: itemData.summary_en?.trim() || null,
    summary_es: itemData.summary_es?.trim() || null,
  }

  const { data, error } = await supabase
    .from('news_feed')
    .update(cleanedData)
    .eq('id', id)
    .select()
    .single()

  if (!error) {
    revalidatePath('/admin/news')
  }

  return {
    data: data as NewsItem | null,
    error: error?.message || null
  }
}

export async function deleteNewsItemAction(id: string) {
  const supabase = createAdminClient()

  if (!supabase) {
    return { data: null, error: 'Database not configured (missing service role key)' }
  }

  const { error } = await supabase
    .from('news_feed')
    .delete()
    .eq('id', id)

  if (!error) {
    revalidatePath('/admin/news')
  }

  return {
    data: null,
    error: error?.message || null
  }
}
