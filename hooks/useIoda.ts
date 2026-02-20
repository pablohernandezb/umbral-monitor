'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const AUTO_REFRESH_MS = 60 * 60 * 1000 // 1 hour

interface UseIodaOptions<T> {
  /** Async function that fetches and returns the data */
  fetcher: () => Promise<T>
  /** Whether to auto-refresh on an interval. Defaults to true. */
  autoRefresh?: boolean
  /** Deps array — when any value changes, refetch immediately */
  deps?: unknown[]
}

export interface UseIodaResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  /** Manually trigger a refresh */
  refresh: () => void
}

/**
 * Centralised IODA data-fetching hook.
 *
 * - Runs the fetcher on mount (and whenever `deps` change)
 * - Auto-refreshes every 5 minutes while the component is mounted
 * - Exposes loading / error / lastUpdated state alongside the data
 * - Components should never call useEffect for IODA fetching directly
 */
export function useIoda<T>(options: UseIodaOptions<T>): UseIodaResult<T> {
  const { fetcher, autoRefresh = true, deps = [] } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Keep the fetcher reference stable so the effect doesn't re-run on each render
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      setData(result)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, []) // intentionally empty — fetcherRef handles updates without re-creating run

  // Fetch on mount and whenever external deps change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    run()
  }, [run, ...deps])

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(run, AUTO_REFRESH_MS)
    return () => clearInterval(id)
  }, [run, autoRefresh])

  return { data, loading, error, lastUpdated, refresh: run }
}
