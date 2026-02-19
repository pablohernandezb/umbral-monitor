'use server'

import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Create a server-side Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
    return null // Mock mode
  }

  return createClient(supabaseUrl, supabaseServiceKey!)
}

/** Hash the client IP so we never store raw addresses. */
async function getIpHash(): Promise<string> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  // Salt with a server secret so hashes can't be reversed via rainbow tables
  const salt = process.env.VOTE_SALT || 'umbral-vote-salt'
  return createHash('sha256').update(ip + salt).digest('hex').slice(0, 32)
}

export async function voteForScenario(
  newsId: string,
  scenarioNumber: number
): Promise<{ success: boolean; newCount?: number; alreadyVoted?: boolean; error?: string }> {
  // Validate scenario number
  if (scenarioNumber < 1 || scenarioNumber > 5) {
    return { success: false, error: 'Invalid scenario number' }
  }

  const supabase = getSupabaseClient()

  // Mock mode - just return success with incremented count
  if (!supabase) {
    console.log(`[Mock] Vote for news ${newsId}, scenario ${scenarioNumber}`)
    return { success: true, newCount: Math.floor(Math.random() * 100) + 1 }
  }

  const ipHash = await getIpHash()
  const columnName = `votes_scenario_${scenarioNumber}`

  try {
    // ── 1. Check if this IP already voted for this scenario ──
    const { data: existing } = await supabase
      .from('news_vote_log')
      .select('id')
      .eq('news_id', newsId)
      .eq('ip_hash', ipHash)
      .eq('scenario_number', scenarioNumber)
      .maybeSingle()

    if (existing) {
      return { success: false, alreadyVoted: true, error: 'Already voted' }
    }

    // ── 2. Log the vote ───────────────────────────────────────
    const { error: logError } = await supabase
      .from('news_vote_log')
      .insert({ news_id: newsId, ip_hash: ipHash, scenario_number: scenarioNumber })

    if (logError) {
      console.error('Error logging vote:', logError)
      return { success: false, error: 'Failed to log vote' }
    }

    // ── 3. Increment the counter on news_feed ─────────────────
    const { data: currentData, error: fetchError } = await supabase
      .from('news_feed')
      .select(columnName)
      .eq('id', newsId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Failed to fetch current vote count' }
    }

    const currentCount = (currentData as unknown as Record<string, number>)[columnName] || 0
    const newCount = currentCount + 1

    const { error: updateError } = await supabase
      .from('news_feed')
      .update({ [columnName]: newCount })
      .eq('id', newsId)

    if (updateError) {
      return { success: false, error: 'Failed to update vote count' }
    }

    return { success: true, newCount }
  } catch (error) {
    console.error('Unexpected error during vote:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
