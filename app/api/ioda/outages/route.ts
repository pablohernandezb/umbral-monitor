import { NextRequest, NextResponse } from 'next/server'
import { VENEZUELA_STATES } from '@/data/venezuela-states'
import type { StateOutageScore, OutageSeverity, OutageScoresBatchResponse } from '@/types/ioda'

const IODA_BASE = 'https://api.ioda.inetintel.cc.gatech.edu/v2'
const MAX_CONCURRENT = 5

function classifySeverity(score: number): OutageSeverity {
  if (score <= 0) return 'normal'
  if (score < 1000) return 'low'
  if (score < 50000) return 'degraded'
  if (score < 200000) return 'high'
  return 'critical'
}

/**
 * Fetch outage summary scores for all 25 Venezuelan regions from IODA.
 * Uses /v2/outages/summary per region and reads scores.overall.
 */
export async function GET(request: NextRequest) {
  const now = Math.floor(Date.now() / 1000)
  const from = now - 24 * 3600 // last 24 hours

  const scores: StateOutageScore[] = []
  const errors: string[] = []

  let running = 0
  let idx = 0

  async function fetchScore(state: typeof VENEZUELA_STATES[number]): Promise<void> {
    const url =
      `${IODA_BASE}/outages/summary` +
      `?entityType=region&entityCode=${state.iodaCode}&from=${from}&until=${now}`

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      })

      if (!res.ok) {
        errors.push(`${state.name}: HTTP ${res.status}`)
        scores.push({ regionCode: state.code, regionName: state.name, score: 0, severity: 'normal' })
        return
      }

      const json = await res.json() as {
        data?: Array<{
          scores?: { overall?: number }
          entity?: { code?: string; name?: string }
        }>
      }

      const entry = json.data?.[0]
      const overall = entry?.scores?.overall ?? 0

      scores.push({
        regionCode: state.code,
        regionName: state.name,
        score: overall,
        severity: classifySeverity(overall),
      })
    } catch (err) {
      errors.push(`${state.name}: ${err instanceof Error ? err.message : 'fetch error'}`)
      scores.push({ regionCode: state.code, regionName: state.name, score: 0, severity: 'normal' })
    }
  }

  // Run with concurrency limit
  await new Promise<void>((resolve) => {
    function next() {
      if (idx >= VENEZUELA_STATES.length && running === 0) {
        resolve()
        return
      }
      while (running < MAX_CONCURRENT && idx < VENEZUELA_STATES.length) {
        const state = VENEZUELA_STATES[idx++]
        running++
        fetchScore(state).finally(() => {
          running--
          next()
        })
      }
    }
    next()
  })

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  const body: OutageScoresBatchResponse = {
    scores,
    fetchedAt: new Date().toISOString(),
    error: errors.length > 0 ? errors.join('; ') : null,
  }

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
