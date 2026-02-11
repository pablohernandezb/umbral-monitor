'use server'

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

export async function voteForScenario(
  newsId: string,
  scenarioNumber: number
): Promise<{ success: boolean; newCount?: number; error?: string }> {
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

  const columnName = `votes_scenario_${scenarioNumber}`

  try {
    // First, get the current count
    const { data: currentData, error: fetchError } = await supabase
      .from('news_feed')
      .select(columnName)
      .eq('id', newsId)
      .single()

    if (fetchError) {
      console.error('Error fetching current vote count:', fetchError)
      return { success: false, error: 'Failed to fetch current vote count' }
    }

    const currentCount = (currentData as unknown as Record<string, number>)[columnName] || 0
    const newCount = currentCount + 1

    // Update the vote count
    const { error: updateError } = await supabase
      .from('news_feed')
      .update({ [columnName]: newCount })
      .eq('id', newsId)

    if (updateError) {
      console.error('Error updating vote count:', updateError)
      return { success: false, error: 'Failed to update vote count' }
    }

    return { success: true, newCount }
  } catch (error) {
    console.error('Unexpected error during vote:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
