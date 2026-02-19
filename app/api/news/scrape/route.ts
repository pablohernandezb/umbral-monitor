import { NextResponse } from 'next/server'
import { runNewsScraper } from '@/lib/news-scraper'

/**
 * GET /api/news/scrape
 *
 * Cron endpoint — scrapes the most recent article from every news source,
 * translates it, and upserts it into the news_feed table.
 * Protected by CRON_SECRET (Vercel sends it as Bearer token automatically).
 * Can also be triggered manually with ?secret=<CRON_SECRET>.
 *
 * Runs daily at 07:00 AM VET (11:00 AM UTC) via vercel.json cron.
 */

// Allow up to 5 min — parallel RSS fetches + two translation batches
export const maxDuration = 300

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await runNewsScraper()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
