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
  userId?: string           // Cache to skip lookup call
  displayName?: string
  profileImageUrl?: string  // Use _400x400 variant
}

const FACT_CHECK_ACCOUNTS: AccountConfig[] = [
  {
    username: 'cazamosfakenews',
    // Fill in userId after first successful lookup to save API calls
  },
  {
    username: 'cotejoinfo',
  },
  {
    username: 'Factchequeado',
  },
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

interface XApiUserResponse {
  data?: XApiUser
  errors?: Array<{ message: string }>
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
 * Look up a user by username to get their ID and profile image.
 */
async function lookupUser(username: string): Promise<XApiUser> {
  const data = await xApiFetch<XApiUserResponse>(
    `/users/by/username/${username}?user.fields=profile_image_url`
  )
  if (!data.data) {
    const errMsg = data.errors?.map(e => e.message).join('; ') || 'User not found'
    throw new XApiError(404, `Lookup @${username}: ${errMsg}`)
  }
  return data.data
}

/**
 * Fetch recent tweets from a user by ID.
 */
async function getUserTweets(userId: string, maxResults: number = 5): Promise<XApiTweet[]> {
  const data = await xApiFetch<XApiTweetsResponse>(
    `/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at`
  )
  return data.data || []
}

/**
 * Detect alert tags in tweet text by scanning for keywords.
 */
function detectAlertTags(text: string): string[] {
  const upperText = text.toUpperCase()
  return ALERT_KEYWORDS.filter(keyword => upperText.includes(keyword))
}

/**
 * Fetch tweets from a single account and return as FactCheckTweet[].
 * Uses cached userId/profile when available to save API calls.
 */
async function fetchAccountTweets(account: AccountConfig): Promise<Omit<FactCheckTweet, 'id' | 'created_at'>[]> {
  let userId = account.userId
  let displayName = account.displayName || account.username
  let profileImage = account.profileImageUrl || ''

  // Only call lookup API if userId is not cached
  if (!userId) {
    const user = await lookupUser(account.username)
    userId = user.id
    displayName = user.name
    profileImage = user.profile_image_url?.replace('_normal', '_400x400') || ''
    // Log so user can cache this in the config
    console.log(`[x-api] Resolved @${account.username} → userId: ${userId}, displayName: ${displayName}, profileImage: ${profileImage}`)
  }

  const tweets = await getUserTweets(userId, 5)

  return tweets.map(tweet => ({
    tweet_id: tweet.id,
    username: account.username,
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

  for (let i = 0; i < FACT_CHECK_ACCOUNTS.length; i++) {
    const account = FACT_CHECK_ACCOUNTS[i]

    // Delay between accounts to respect free-tier rate limits (skip first)
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    try {
      const tweets = await fetchAccountTweets(account)
      totalFetched += tweets.length

      if (tweets.length === 0) {
        errors.push(`No tweets fetched for @${account.username}`)
        continue
      }

      // Upsert tweets (on conflict of tweet_id, update text and fetched_at)
      const { error } = await supabase
        .from('fact_check_tweets')
        .upsert(
          tweets.map(t => ({
            ...t,
            alert_tags: t.alert_tags,
          })),
          { onConflict: 'tweet_id' }
        )

      if (error) {
        errors.push(`Supabase upsert error for @${account.username}: ${error.message}`)
      } else {
        totalUpserted += tweets.length
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`Failed to fetch @${account.username}: ${message}`)

      // If rate limited, stop trying remaining accounts
      if (err instanceof XApiError && err.status === 429) {
        errors.push(`Rate limited — skipping remaining accounts`)
        break
      }
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
