import { createAdminClient } from './supabase-server'
import { IS_MOCK_MODE } from './supabase'
import type { FactCheckTweet } from '@/types'

// ============================================================
// X API v2 Client for Fact-Check Tweet Fetching
// ============================================================

const X_API_BASE = 'https://api.x.com/2'

// Cached account profiles to avoid wasting API calls on user lookups.
// To find a user ID: https://api.x.com/2/users/by/username/USERNAME
// (or the first run without a cached ID will look it up and log it)
interface AccountConfig {
  username: string
  displayName?: string      // Optional override; resolved from API on first fetch
  profileImageUrl?: string  // Optional override; resolved from API on first fetch
}

const FACT_CHECK_ACCOUNTS: AccountConfig[] = [
  { username: 'cazamosfakenews' },
  { username: 'cotejoinfo' },
  { username: 'factchequeado' },
]

// Alert keywords to detect in tweet text
const ALERT_KEYWORDS = ['FALSO', 'ENGAÑOSO', 'DESMENTIDO', 'FALSE', 'MISLEADING', 'DEBUNKED']

interface XApiUser {
  id: string
  name: string
  username: string
  profile_image_url: string
}

interface XApiTweet {
  id: string
  text: string
  created_at: string
  author_id: string
}

interface XApiTweetsResponse {
  data?: XApiTweet[]
  includes?: { users?: XApiUser[] }
  errors?: Array<{ message: string }>
  meta?: { result_count: number }
}

function getBearer(): string | null {
  return process.env.X_BEARER_TOKEN || null
}

class XApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function xApiFetch<T>(endpoint: string): Promise<T> {
  const bearer = getBearer()
  if (!bearer) {
    throw new XApiError(0, 'X_BEARER_TOKEN not configured')
  }

  const res = await fetch(`${X_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
    next: { revalidate: 0 }, // no cache
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new XApiError(res.status, `X API ${res.status}: ${errorText}`)
  }

  return res.json()
}

/**
 * Search recent tweets by username using the search/recent endpoint.
 * This avoids a separate user ID lookup and works on the Basic plan.
 * Author profile data is fetched via expansions in the same request.
 */
async function searchUserTweets(
  username: string,
  maxResults: number = 10
): Promise<{ tweets: XApiTweet[]; author: XApiUser | null }> {
  const query = encodeURIComponent(`from:${username} -is:retweet`)
  const data = await xApiFetch<XApiTweetsResponse>(
    `/tweets/search/recent?query=${query}&max_results=${maxResults}&tweet.fields=created_at&expansions=author_id&user.fields=profile_image_url,name`
  )
  const tweets = data.data || []
  const author = data.includes?.users?.[0] ?? null
  return { tweets, author }
}

/**
 * Detect alert tags in tweet text by scanning for keywords.
 */
function detectAlertTags(text: string): string[] {
  const upperText = text.toUpperCase()
  return ALERT_KEYWORDS.filter(keyword => upperText.includes(keyword))
}

/**
 * Fetch tweets from a single account using the search/recent endpoint.
 * No user ID lookup required — author profile comes back in the same request.
 */
async function fetchAccountTweets(account: AccountConfig): Promise<Omit<FactCheckTweet, 'id' | 'created_at'>[]> {
  const { tweets, author } = await searchUserTweets(account.username, 10)

  const displayName = author?.name || account.displayName || account.username
  const profileImage = author?.profile_image_url?.replace('_normal', '_400x400')
    || account.profileImageUrl
    || ''

  return tweets.map(tweet => ({
    tweet_id: tweet.id,
    username: account.username.toLowerCase(),
    display_name: displayName,
    profile_image_url: profileImage,
    text_es: tweet.text,
    text_en: null,
    tweet_url: `https://x.com/${account.username}/status/${tweet.id}`,
    alert_tags: detectAlertTags(tweet.text),
    published_at: tweet.created_at,
    fetched_at: new Date().toISOString(),
  }))
}

/**
 * Fetch tweets from all configured accounts and upsert into Supabase.
 * Returns a summary of the operation.
 */
export async function refreshFactCheckTweets(): Promise<{
  success: boolean
  fetched: number
  upserted: number
  errors: string[]
}> {
  const errors: string[] = []
  let totalFetched = 0
  let totalUpserted = 0

  if (IS_MOCK_MODE) {
    return { success: true, fetched: 0, upserted: 0, errors: ['Mock mode active, skipping API fetch'] }
  }

  const bearer = getBearer()
  if (!bearer) {
    return { success: false, fetched: 0, upserted: 0, errors: ['X_BEARER_TOKEN not configured'] }
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return { success: false, fetched: 0, upserted: 0, errors: ['Supabase admin client not available'] }
  }

  // Fetch all accounts in parallel — the old sequential + 5s delays approach
  // caused Vercel Hobby (10s cap) to time out after the first account.
  // X Basic allows 10 req/15min; 3 concurrent search requests is well within that.
  const results = await Promise.allSettled(
    FACT_CHECK_ACCOUNTS.map(account => fetchAccountTweets(account))
  )

  // Upsert each account's tweets, collecting errors
  for (let i = 0; i < FACT_CHECK_ACCOUNTS.length; i++) {
    const account = FACT_CHECK_ACCOUNTS[i]
    const result = results[i]

    if (result.status === 'rejected') {
      const err = result.reason
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`Failed to fetch @${account.username}: ${message}`)
      continue
    }

    const tweets = result.value
    totalFetched += tweets.length

    if (tweets.length === 0) {
      errors.push(`No tweets fetched for @${account.username}`)
      continue
    }

    const { error } = await supabase
      .from('fact_check_tweets')
      .upsert(
        tweets.map(t => ({ ...t, alert_tags: t.alert_tags })),
        { onConflict: 'tweet_id' }
      )

    if (error) {
      errors.push(`Supabase upsert error for @${account.username}: ${error.message}`)
    } else {
      totalUpserted += tweets.length
    }
  }

  return {
    success: errors.length === 0,
    fetched: totalFetched,
    upserted: totalUpserted,
    errors,
  }
}

/**
 * List of monitored account usernames (exported for use in UI).
 */
export const FACT_CHECK_ACCOUNT_LIST = FACT_CHECK_ACCOUNTS.map(a => a.username)
