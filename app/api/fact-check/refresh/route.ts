import { NextResponse } from 'next/server'
import { refreshFactCheckTweets } from '@/lib/x-api'

/**
 * GET /api/fact-check/refresh
 *
 * Cron endpoint to fetch latest tweets from fact-checking accounts
 * and cache them in Supabase. Protected by CRON_SECRET.
 *
 * Vercel Cron sends the secret in the Authorization header.
 * Can also be triggered manually with ?secret=<CRON_SECRET>.
 */
export async function GET(request: Request) {
  // Verify authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const querySecret = searchParams.get('secret')

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` ||
      querySecret === cronSecret

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  try {
    const result = await refreshFactCheckTweets()

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
