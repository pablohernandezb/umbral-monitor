'use server'

import { createAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { FactCheckTweet } from '@/types'
import { randomUUID } from 'crypto'

export async function getAllFactCheckTweetsAction(): Promise<{ data: FactCheckTweet[] | null; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { data: [], error: null }

  const { data, error } = await supabase
    .from('fact_check_tweets')
    .select('*')
    .order('published_at', { ascending: false })

  return { data: data ?? [], error: error?.message ?? null }
}

export async function createFactCheckTweetAction(
  input: Pick<FactCheckTweet, 'username' | 'display_name' | 'profile_image_url' | 'text_es' | 'text_en' | 'tweet_url' | 'alert_tags' | 'published_at'>
): Promise<{ data: null; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { data: null, error: 'Database not configured' }

  const now = new Date().toISOString()
  const { error } = await supabase.from('fact_check_tweets').insert({
    tweet_id: randomUUID(),
    username: input.username.toLowerCase(),
    display_name: input.display_name,
    profile_image_url: input.profile_image_url || '',
    text_es: input.text_es,
    text_en: input.text_en || null,
    tweet_url: input.tweet_url,
    alert_tags: input.alert_tags,
    published_at: input.published_at,
    fetched_at: now,
  })

  if (!error) revalidatePath('/admin/fact-check')
  return { data: null, error: error?.message ?? null }
}

export async function updateFactCheckTweetAction(
  id: string,
  input: Pick<FactCheckTweet, 'username' | 'display_name' | 'profile_image_url' | 'text_es' | 'text_en' | 'tweet_url' | 'alert_tags' | 'published_at'>
): Promise<{ data: null; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { data: null, error: 'Database not configured' }

  const { error } = await supabase.from('fact_check_tweets').update({
    username: input.username.toLowerCase(),
    display_name: input.display_name,
    profile_image_url: input.profile_image_url || '',
    text_es: input.text_es,
    text_en: input.text_en || null,
    tweet_url: input.tweet_url,
    alert_tags: input.alert_tags,
    published_at: input.published_at,
  }).eq('id', id)

  if (!error) revalidatePath('/admin/fact-check')
  return { data: null, error: error?.message ?? null }
}

export async function deleteFactCheckTweetAction(id: string): Promise<{ data: null; error: string | null }> {
  const supabase = createAdminClient()
  if (!supabase) return { data: null, error: null }

  const { error } = await supabase.from('fact_check_tweets').delete().eq('id', id)
  if (!error) revalidatePath('/admin/fact-check')
  return { data: null, error: error?.message ?? null }
}
