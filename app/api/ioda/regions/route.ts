import { NextRequest, NextResponse } from 'next/server'
import { VENEZUELA_STATES } from '@/data/venezuela-states'
import type { RegionSignalData, RegionsBatchResponse } from '@/types/ioda'

const IODA_BASE = 'https://api.ioda.inetintel.cc.gatech.edu/v2'
const MAX_CONCURRENT = 5

/**
 * Fetch raw signals for all 25 Venezuelan regions from IODA.
 *
 * Query params:
 *   datasource  – 'bgp' (default) | 'ping-slash24' | 'merit-nt'
 *   hours       – lookback window (default 24)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const datasource = params.get('datasource') ?? 'bgp'
  const hours = Math.min(Number(params.get('hours') ?? '24'), 168)

  const now = Math.floor(Date.now() / 1000)
  const from = now - hours * 3600

  const regions: RegionSignalData[] = []
  const errors: string[] = []

  // Semaphore for concurrency limiting
  let running = 0
  let idx = 0

  async function fetchRegion(state: typeof VENEZUELA_STATES[number]): Promise<void> {
    const url =
      `${IODA_BASE}/signals/raw/region/${state.iodaCode}` +
      `?from=${from}&until=${now}&datasource=${encodeURIComponent(datasource)}`

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      })

      if (!res.ok) {
        errors.push(`${state.name}: HTTP ${res.status}`)
        return
      }

      const json = await res.json() as { data?: unknown[][] }

      // IODA v2 returns { data: [[signal1, signal2, ...]] }
      const signalArrays = Array.isArray(json.data) ? json.data.flat() : []

      // Find the signal matching the requested datasource
      const signal = signalArrays.find(
        (s: unknown) =>
          typeof s === 'object' && s !== null && (s as Record<string, unknown>).datasource === datasource
      ) as { from?: number; step?: number; values?: (number | null)[] } | undefined

      if (signal && signal.values) {
        regions.push({
          regionCode: state.code,
          regionName: state.name,
          datasource,
          from: signal.from ?? from,
          step: signal.step ?? 300,
          values: signal.values,
        })
      } else {
        // No data for this datasource/region — push empty
        regions.push({
          regionCode: state.code,
          regionName: state.name,
          datasource,
          from,
          step: 300,
          values: [],
        })
      }
    } catch (err) {
      errors.push(`${state.name}: ${err instanceof Error ? err.message : 'fetch error'}`)
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
        fetchRegion(state).finally(() => {
          running--
          next()
        })
      }
    }
    next()
  })

  // Sort regions by code for consistent ordering
  regions.sort((a, b) => a.regionCode.localeCompare(b.regionCode, undefined, { numeric: true }))

  const body: RegionsBatchResponse = {
    datasource,
    regions,
    fetchedAt: new Date().toISOString(),
    error: errors.length > 0 ? errors.join('; ') : null,
  }

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
