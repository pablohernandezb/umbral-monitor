import { supabase, IS_MOCK_MODE } from './supabase'
import type {
  Scenario,
  RegimeHistory,
  DemBreakdownHistory,
  NewsItem,
  PoliticalPrisoner,
  PrisonerByOrganization,
  PrisonersByOrganization,
  DEEDEvent,
  ReadingRoomItem,
  HistoricalEpisode,
  FactCheckTweet,
  ExpertSubmission,
  PublicSubmission,
  ApiResponse,
} from '@/types'

// Import mock data
import {
  mockScenarios,
  mockRegimeHistory,
  mockDemBreakdownHistory,
  mockNewsFeed,
  mockPoliticalPrisoners,
  mockPrisonersByOrg,
  mockDEEDEvents,
  mockReadingRoom,
  mockHistoricalEpisodes,
  mockFactCheckTweets,
} from '@/data/mock'

// ============================================================
// SCENARIOS
// ============================================================
export async function getScenarios(): Promise<ApiResponse<Scenario[]>> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: mockScenarios, error: null }
  }

  const { data, error } = await supabase
    .from('scenarios')
    .select('*')

  return {
    data: data as Scenario[] | null,
    error: error?.message || null,
  }
}

// ============================================================
// REGIME HISTORY
// ============================================================
export async function getRegimeHistory(
  startYear?: number,
  endYear?: number
): Promise<ApiResponse<RegimeHistory[]>> {
  if (IS_MOCK_MODE || !supabase) {
    let data = mockRegimeHistory
    if (startYear) data = data.filter(d => d.year >= startYear)
    if (endYear) data = data.filter(d => d.year <= endYear)
    return { data, error: null }
  }

  let query = supabase
    .from('regime_history')
    .select('*')
    .order('year', { ascending: true })

  if (startYear) query = query.gte('year', startYear)
  if (endYear) query = query.lte('year', endYear)

  const { data, error } = await query

  return {
    data: data as RegimeHistory[] | null,
    error: error?.message || null,
  }
}

export async function getDemBreakdownHistory(
  startYear?: number,
  endYear?: number
): Promise<ApiResponse<DemBreakdownHistory[]>> {
  if (IS_MOCK_MODE || !supabase) {
    let data = mockDemBreakdownHistory
    if (startYear) data = data.filter(d => d.year >= startYear)
    if (endYear) data = data.filter(d => d.year <= endYear)
    return { data, error: null }
  }

  let query = supabase
    .from('regime_history')
    .select('*')
    .order('year', { ascending: true })

  if (startYear) query = query.gte('year', startYear)
  if (endYear) query = query.lte('year', endYear)

  const { data, error } = await query

  return {
    data: data as RegimeHistory[] | null,
    error: error?.message || null,
  }
}


// ============================================================
// NEWS FEED
// ============================================================
export async function getNewsFeed(
  limit: number = 10,
  category?: string
): Promise<ApiResponse<NewsItem[]>> {
  if (IS_MOCK_MODE || !supabase) {
    let data = mockNewsFeed
    if (category) data = data.filter(d => d.category_en === category)
    return { data: data.slice(0, limit), error: null }
  }

  let query = supabase
    .from('news_feed')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) query = query.eq('category_en', category)

  const { data, error } = await query

  return {
    data: data as NewsItem[] | null,
    error: error?.message || null,
  }
}

// ============================================================
// POLITICAL PRISONERS
// ============================================================
export async function getLatestPrisonerStats(): Promise<ApiResponse<PoliticalPrisoner>> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: mockPoliticalPrisoners[0], error: null }
  }

  const { data, error } = await supabase
    .from('political_prisoners')
    .select('*')
    .order('data_date', { ascending: false })
    .limit(1)
    .single()

  return {
    data: data as PoliticalPrisoner | null,
    error: error?.message || null,
  }
}

export async function getPrisonersByOrganization(): Promise<ApiResponse<PrisonerByOrganization[]>> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: mockPrisonersByOrg, error: null }
  }

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .select('*')
    .order('count', { ascending: false })

  return {
    data: data as PrisonerByOrganization[] | null,
    error: error?.message || null,
  }
}

// ============================================================
// DEED EVENTS
// ============================================================
export async function getDEEDEvents(year?: number): Promise<ApiResponse<DEEDEvent[]>> {
  if (IS_MOCK_MODE || !supabase) {
    let data = mockDEEDEvents
    if (year) data = data.filter(d => d.year === year)
    return { data, error: null }
  }

  let query = supabase
    .from('events_deed')
    .select('*')
    .order('year', { ascending: true })

  if (year) query = query.eq('year', year)

  const { data, error } = await query

  return {
    data: data as DEEDEvent[] | null,
    error: error?.message || null,
  }
}

// ============================================================
// READING ROOM
// ============================================================
export async function getReadingRoomItems(
  type?: string,
  language?: string,
  limit?: number
): Promise<ApiResponse<ReadingRoomItem[]>> {
  if (IS_MOCK_MODE || !supabase) {
    let data = mockReadingRoom
    if (type && type !== 'all') data = data.filter(d => d.type === type)
    if (language && language !== 'all') data = data.filter(d => d.language === language || d.language === 'both')
    if (limit) data = data.slice(0, limit)
    return { data, error: null }
  }

  let query = supabase
    .from('reading_room')
    .select('*')
    .order('year', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)
  if (language && language !== 'all') {
    query = query.or(`language.eq.${language},language.eq.both`)
  }
  if (limit) query = query.limit(limit)

  const { data, error } = await query

  return {
    data: data as ReadingRoomItem[] | null,
    error: error?.message || null,
  }
}

// ============================================================
// HISTORICAL EPISODES
// ============================================================
export async function getHistoricalEpisodes(): Promise<ApiResponse<HistoricalEpisode[]>> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: mockHistoricalEpisodes, error: null }
  }

  const { data, error } = await supabase
    .from('historical_episodes')
    .select('*')
    .order('start_year', { ascending: true })

  return {
    data: data as HistoricalEpisode[] | null,
    error: error?.message || null,
  }
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// Use these in components with useEffect
// ============================================================

/**
 * Subscribe to news feed updates
 * 
 * Usage in component:
 * useEffect(() => {
 *   const unsubscribe = subscribeToNews((payload) => {
 *     // Handle new news item
 *     setNews(prev => [payload.new, ...prev])
 *   })
 *   return () => unsubscribe()
 * }, [])
 */
export function subscribeToNews(
  callback: (payload: { new: NewsItem }) => void
): () => void {
  if (IS_MOCK_MODE || !supabase) {
    // In mock mode, return a no-op unsubscribe
    return () => {}
  }

  const client = supabase
  const channel = client
    .channel('news_feed_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'news_feed' },
      (payload) => callback(payload as unknown as { new: NewsItem })
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

/**
 * Subscribe to political prisoner stat updates
 */
export function subscribeToPrisonerStats(
  callback: (payload: { new: PoliticalPrisoner }) => void
): () => void {
  if (IS_MOCK_MODE || !supabase) {
    return () => {}
  }

  const client = supabase
  const channel = client
    .channel('prisoner_stats_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'political_prisoners' },
      (payload) => callback(payload as unknown as { new: PoliticalPrisoner })
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

/**
 * Subscribe to scenario updates
 */
export function subscribeToScenarios(
  callback: (payload: { new: Scenario }) => void
): () => void {
  if (IS_MOCK_MODE || !supabase) {
    return () => {}
  }

  const client = supabase
  const channel = client
    .channel('scenarios_changes')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'scenarios' },
      (payload) => callback(payload as unknown as { new: Scenario })
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}

// ============================================================
// ADMIN WRITE OPERATIONS
// Functions for authenticated users to create, update, delete content
// ============================================================

import { mockAdminState } from './mock-admin-state'

// Political Prisoners CRUD
export async function getAllPrisonerStats(): Promise<ApiResponse<PoliticalPrisoner[]>> {
  if (IS_MOCK_MODE) {
    return { data: mockAdminState.getAllPrisoners(), error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('political_prisoners')
    .select('*')
    .order('data_date', { ascending: false })

  // Map data_date to date for consistency
  const mappedData = data?.map(item => ({
    ...item,
    date: item.data_date,
  })) || null

  return { data: mappedData as PoliticalPrisoner[] | null, error: error?.message || null }
}

export async function createPrisonerStats(
  data: Omit<PoliticalPrisoner, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<PoliticalPrisoner>> {
  if (IS_MOCK_MODE) {
    const newPrisoner = mockAdminState.createPrisoner(data)
    return { data: newPrisoner, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data: created, error } = await supabase
    .from('political_prisoners')
    .insert(data)
    .select()
    .single()

  return { data: created as PoliticalPrisoner | null, error: error?.message || null }
}

export async function updatePrisonerStats(
  id: string,
  data: Partial<PoliticalPrisoner>
): Promise<ApiResponse<PoliticalPrisoner>> {
  if (IS_MOCK_MODE) {
    const updated = mockAdminState.updatePrisoner(id, data)
    if (!updated) {
      return { data: null, error: 'Record not found' }
    }
    return { data: updated, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data: updated, error } = await supabase
    .from('political_prisoners')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  return { data: updated as PoliticalPrisoner | null, error: error?.message || null }
}

export async function deletePrisonerStats(id: string): Promise<ApiResponse<null>> {
  if (IS_MOCK_MODE) {
    const success = mockAdminState.deletePrisoner(id)
    if (!success) {
      return { data: null, error: 'Record not found' }
    }
    return { data: null, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { error } = await supabase
    .from('political_prisoners')
    .delete()
    .eq('id', id)

  return { data: null, error: error?.message || null }
}

// Prisoners by Organization CRUD
export async function getAllPrisonersByOrg(): Promise<ApiResponse<PrisonersByOrganization[]>> {
  if (IS_MOCK_MODE) {
    return { data: mockAdminState.getAllPrisonersByOrg(), error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('prisoners_by_organization')
    .select('*')
    .order('date', { ascending: false })

  return { data: data as PrisonersByOrganization[] | null, error: error?.message || null }
}

export async function createPrisonerByOrg(
  data: Omit<PrisonersByOrganization, 'id' | 'created_at' | 'updated_at'>
): Promise<ApiResponse<PrisonersByOrganization>> {
  if (IS_MOCK_MODE) {
    const newRecord = mockAdminState.createPrisonerByOrg(data)
    return { data: newRecord, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data: created, error } = await supabase
    .from('prisoners_by_organization')
    .insert(data)
    .select()
    .single()

  return { data: created as PrisonersByOrganization | null, error: error?.message || null }
}

export async function updatePrisonerByOrg(
  id: string,
  data: Partial<PrisonersByOrganization>
): Promise<ApiResponse<PrisonersByOrganization>> {
  if (IS_MOCK_MODE) {
    const updated = mockAdminState.updatePrisonerByOrg(id, data)
    if (!updated) {
      return { data: null, error: 'Record not found' }
    }
    return { data: updated, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data: updated, error } = await supabase
    .from('prisoners_by_organization')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  return { data: updated as PrisonersByOrganization | null, error: error?.message || null }
}

export async function deletePrisonerByOrg(id: string): Promise<ApiResponse<null>> {
  if (IS_MOCK_MODE) {
    const success = mockAdminState.deletePrisonerByOrg(id)
    if (!success) {
      return { data: null, error: 'Record not found' }
    }
    return { data: null, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { error } = await supabase
    .from('prisoners_by_organization')
    .delete()
    .eq('id', id)

  return { data: null, error: error?.message || null }
}

// Reading Room CRUD
export async function getAllReadingRoomItems(): Promise<ApiResponse<ReadingRoomItem[]>> {
  if (IS_MOCK_MODE) {
    return { data: mockAdminState.getAllReadingRoom(), error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data, error } = await supabase
    .from('reading_room')
    .select('*')
    .order('year', { ascending: false })

  return { data: data as ReadingRoomItem[] | null, error: error?.message || null }
}

export async function createReadingRoomItem(
  data: Omit<ReadingRoomItem, 'id' | 'created_at'>
): Promise<ApiResponse<ReadingRoomItem>> {
  if (IS_MOCK_MODE) {
    const newItem = mockAdminState.createReadingRoomItem(data)
    return { data: newItem, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data: created, error } = await supabase
    .from('reading_room')
    .insert(data)
    .select()
    .single()

  return { data: created as ReadingRoomItem | null, error: error?.message || null }
}

export async function updateReadingRoomItem(
  id: string,
  data: Partial<ReadingRoomItem>
): Promise<ApiResponse<ReadingRoomItem>> {
  if (IS_MOCK_MODE) {
    const updated = mockAdminState.updateReadingRoomItem(id, data)
    if (!updated) {
      return { data: null, error: 'Item not found' }
    }
    return { data: updated, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { data: updated, error } = await supabase
    .from('reading_room')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  return { data: updated as ReadingRoomItem | null, error: error?.message || null }
}

export async function deleteReadingRoomItem(id: string): Promise<ApiResponse<null>> {
  if (IS_MOCK_MODE) {
    const success = mockAdminState.deleteReadingRoomItem(id)
    if (!success) {
      return { data: null, error: 'Item not found' }
    }
    return { data: null, error: null }
  }

  if (!supabase) {
    return { data: null, error: 'Database not configured' }
  }

  const { error } = await supabase
    .from('reading_room')
    .delete()
    .eq('id', id)

  return { data: null, error: error?.message || null }
}

// ============================================================
// FACT-CHECK TWEETS
// ============================================================
export async function getFactCheckTweets(
  limit: number = 15
): Promise<ApiResponse<FactCheckTweet[]>> {
  if (IS_MOCK_MODE || !supabase) {
    return { data: mockFactCheckTweets.slice(0, limit), error: null }
  }

  const { data, error } = await supabase
    .from('fact_check_tweets')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    // Fall back to mock data on error
    return { data: mockFactCheckTweets.slice(0, limit), error: error.message }
  }

  // If Supabase table is empty, fall back to mock data
  if (!data || data.length === 0) {
    return { data: mockFactCheckTweets.slice(0, limit), error: null }
  }

  return {
    data: data as FactCheckTweet[],
    error: null,
  }
}

// ============================================================
// SUBMISSION AVERAGES (for scenario cards on landing page)
// ============================================================

export interface SubmissionAverages {
  expert: Record<number, number>  // scenario number (1-5) -> mean rating (1-5)
  public: Record<number, number>
  expertCount: number  // unique participants
  publicCount: number
}

export async function getSubmissionAverages(): Promise<ApiResponse<SubmissionAverages>> {
  const empty: SubmissionAverages = {
    expert: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    public: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    expertCount: 0,
    publicCount: 0,
  }

  if (IS_MOCK_MODE || !supabase) {
    return { data: empty, error: null }
  }

  // Fetch approved expert submissions and all public submissions in parallel
  const [expertRes, publicRes] = await Promise.all([
    supabase
      .from('expert_submissions')
      .select('email, scenario_probabilities, submitted_at')
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false }),
    supabase
      .from('public_submissions')
      .select('email, scenario_probabilities, submitted_at')
      .order('submitted_at', { ascending: false }),
  ])

  // Deduplicate by email (keep latest per email — already sorted DESC)
  function dedupeByEmail<T extends { email: string; scenario_probabilities: Record<number, number> | null }>(
    rows: T[]
  ): T[] {
    const seen = new Set<string>()
    const result: T[] = []
    for (const row of rows) {
      const email = row.email.toLowerCase()
      if (!seen.has(email)) {
        seen.add(email)
        result.push(row)
      }
    }
    return result
  }

  // Compute mean per scenario (1-5)
  function computeMeans(rows: Array<{ scenario_probabilities: Record<number, number> | null }>): Record<number, number> {
    const means: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    if (rows.length === 0) return means

    for (let s = 1; s <= 5; s++) {
      const values = rows
        .map(r => r.scenario_probabilities?.[s])
        .filter((v): v is number => typeof v === 'number' && v > 0)
      means[s] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0
    }
    return means
  }

  const expertRows = dedupeByEmail(
    (expertRes.data || []) as Array<{ email: string; scenario_probabilities: Record<number, number> | null; submitted_at: string }>
  )
  const publicRows = dedupeByEmail(
    (publicRes.data || []) as Array<{ email: string; scenario_probabilities: Record<number, number> | null; submitted_at: string }>
  )

  return {
    data: {
      expert: computeMeans(expertRows),
      public: computeMeans(publicRows),
      expertCount: expertRows.length,
      publicCount: publicRows.length,
    },
    error: expertRes.error?.message || publicRes.error?.message || null,
  }
}
