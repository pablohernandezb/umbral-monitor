'use client'

import { useState, useMemo, useCallback } from 'react'
import { Monitor, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { getSignals, getOutageEvents, normalizeSignalSeries, getStoredDashboardData, getRegionOutageScores, getStoredRegionOutages } from '@/lib/ioda'
import { IS_MOCK_MODE } from '@/lib/supabase'
import { useIoda } from '@/hooks/useIoda'
import { StatusBadge } from './StatusBadge'
import { RegionSelector } from './RegionSelector'
import { SignalChart } from './SignalChart'
import { OutageEventList } from './OutageEventList'
import type {
  IODAEntity,
  NormalizedSignalPoint,
  IODAOutageEvent,
  ConnectivityStatus,
  TimeRange,
  OutageScoresBatchResponse,
  StateOutageScore,
} from '@/types/ioda'
import { TIME_RANGE_HOURS } from '@/types/ioda'
import { VenezuelaMap } from './VenezuelaMap'
import { OutageScoreList } from './OutageScoreList'

// ── Types ──────────────────────────────────────────────────────────────────

interface DashboardData {
  signals: NormalizedSignalPoint[]
  events: IODAOutageEvent[]
}

interface IodaDashboardProps {
  /** Default entity type — can be overridden by region selection */
  defaultEntityType?: string
  /** Default entity code */
  defaultEntityCode?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

const TIME_RANGE_OPTIONS: TimeRange[] = ['24h', '48h', '7d']

/**
 * Derive overall connectivity status from the latest signal point and events.
 * Logic: if any recent event has a critical score → outage;
 *        if signals are significantly below their array median → degraded;
 *        otherwise normal.
 */
function deriveStatus(
  signals: NormalizedSignalPoint[],
  events: IODAOutageEvent[]
): ConnectivityStatus {
  if (signals.length === 0) return 'no-data'

  // Check for very recent events (last 2 hours = 7200 seconds)
  const recentCutoff = Math.floor(Date.now() / 1000) - 7200
  const recentEvents = events.filter((e) => e.start >= recentCutoff)

  if (recentEvents.some((e) => e.score >= 500)) return 'outage'
  if (recentEvents.some((e) => e.score >= 100)) return 'degraded'

  // Check BGP signal drop: compare last point to median of last 24 data points
  const recent = signals.slice(-24)
  const bgpValues = recent.map((p) => p.bgp).filter((v): v is number => v !== null)
  if (bgpValues.length >= 4) {
    const sorted = [...bgpValues].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const latest = bgpValues[bgpValues.length - 1]
    // A drop of more than 20% below median = degraded
    if (latest < median * 0.8) return 'degraded'
    // A drop of more than 50% = outage
    if (latest < median * 0.5) return 'outage'
  }

  return 'normal'
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export function IodaDashboard({
  defaultEntityType = 'country',
  defaultEntityCode = 'VE',
}: IodaDashboardProps) {
  const { t } = useTranslation()
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [entityType, setEntityType] = useState(defaultEntityType)
  const [entityCode, setEntityCode] = useState(defaultEntityCode)
  const [selectedRegion, setSelectedRegion] = useState<IODAEntity | null>(null)
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  const handleRegionSelect = useCallback((entity: IODAEntity | null) => {
    setSelectedRegion(entity)
    if (entity) {
      setEntityType('region')
      setEntityCode(entity.code)
    } else {
      setEntityType(defaultEntityType)
      setEntityCode(defaultEntityCode)
    }
  }, [defaultEntityType, defaultEntityCode])

  // Main data fetch — re-runs when entityType, entityCode, or timeRange changes.
  // In Supabase mode: reads exclusively from DB (populated once/day by cron).
  // In mock mode: fetches live from IODA API (development only).
  const { data, loading, error, lastUpdated, refresh } = useIoda<DashboardData>({
    fetcher: async () => {
      const hours = TIME_RANGE_HOURS[timeRange]

      if (!IS_MOCK_MODE) {
        // Supabase mode — DB is the single source of truth; no live fallback
        const res = await getStoredDashboardData(entityType, entityCode, hours)
        return {
          signals: res.data?.signals ?? [],
          events:  res.data?.events  ?? [],
        }
      }

      // Mock mode (development) — fetch live from IODA
      const [signalRes, eventRes] = await Promise.all([
        getSignals(entityType, entityCode, hours),
        getOutageEvents(entityType, entityCode, hours),
      ])
      return {
        signals: signalRes.data ? normalizeSignalSeries(signalRes.data) : [],
        events:  eventRes.data ?? [],
      }
    },
    deps: [entityType, entityCode, timeRange],
    // Data updates once/day via cron — auto-refresh would only re-read the same DB rows
    autoRefresh: false,
  })

  const outageResult = useIoda<OutageScoresBatchResponse>({
    fetcher: () => IS_MOCK_MODE ? getRegionOutageScores() : getStoredRegionOutages(),
    deps: [],
    autoRefresh: false,
  })

  const outageScores = useMemo(() => {
    const map = new Map<string, StateOutageScore>()
    for (const s of outageResult.data?.scores ?? []) map.set(s.regionCode, s)
    return map
  }, [outageResult.data])

  const scoresList = useMemo(
    () => [...(outageResult.data?.scores ?? [])].sort((a, b) => b.score - a.score),
    [outageResult.data]
  )

  const status = deriveStatus(data?.signals ?? [], data?.events ?? [])
  const signals = data?.signals ?? []
  const events = data?.events ?? []

  return (
    <div className="rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4 text-signal-teal" />
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              {t('ioda.monitor.title')}
            </h3>
            <p className="text-[10px] text-umbral-muted mt-0.5">
              {t('ioda.monitor.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <StatusBadge status={status} />

          {/* Manual refresh */}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1.5 rounded-md border border-umbral-ash text-umbral-muted hover:text-white hover:border-umbral-steel transition-colors disabled:opacity-40"
            aria-label={t('ioda.monitor.refreshLabel')}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>

          {/* IODA link */}
          <a
            href={`https://ioda.inetintel.cc.gatech.edu/country/VE`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] font-mono text-signal-teal hover:underline shrink-0"
          >
            <ExternalLink className="w-3 h-3" />
            IODA
          </a>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        {/* ── Controls row: time range + region selector ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Time range pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-umbral-muted mr-1 uppercase tracking-wider">{t('ioda.monitor.range')}:</span>
            {TIME_RANGE_OPTIONS.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-mono border transition-colors',
                  timeRange === range
                    ? 'border-signal-teal/50 bg-signal-teal/10 text-signal-teal'
                    : 'border-umbral-ash text-umbral-muted hover:border-umbral-steel hover:text-umbral-light'
                )}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Region selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-umbral-muted uppercase tracking-wider shrink-0">{t('ioda.monitor.region')}:</span>
            <RegionSelector
              selectedCode={selectedRegion?.code ?? null}
              onSelect={handleRegionSelect}
            />
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-3 text-xs font-mono text-signal-red">
            {t('ioda.monitor.signalFetchError')}: {error}
          </div>
        )}

        {/* ── Main content: 3 signal charts + event list ── */}
        <p className="text-[10px] font-mono text-umbral-muted uppercase tracking-wider -mb-2">
          {t('ioda.monitor.signalTimeSeries')} · {selectedRegion?.name ?? t('ioda.monitor.nationalRegion')}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          {/* Left 2/3: signal charts + event list */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {/* Top row: BGP + Probing */}
            <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loading ? (
                <>
                  {['BGP', 'Probing'].map((l) => (
                    <div key={l} className="h-[220px] sm:h-full bg-umbral-ash/10 rounded-lg animate-pulse flex items-center justify-center">
                      <span className="text-[10px] font-mono text-umbral-muted">{l}…</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <SignalChart
                    data={signals}
                    events={events}
                    dataKey="bgp"
                    label={t('ioda.signals.bgpLabel')}
                    description={t('ioda.signals.bgpDescription')}
                    color="#f59e0b"
                    className="h-[220px] sm:h-full"
                  />
                  <SignalChart
                    data={signals}
                    events={events}
                    dataKey="probing"
                    label={t('ioda.signals.probingLabel')}
                    description={t('ioda.signals.probingDescription')}
                    color="#3b82f6"
                    className="h-[220px] sm:h-full"
                  />
                </>
              )}
            </div>

            {/* Bottom row: Telescope + Event List */}
            <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
              {loading ? (
                <div className="h-[220px] sm:h-full bg-umbral-ash/10 rounded-lg animate-pulse flex items-center justify-center">
                  <span className="text-[10px] font-mono text-umbral-muted">Telescope…</span>
                </div>
              ) : (
                <SignalChart
                  data={signals}
                  events={events}
                  dataKey="telescope"
                  label={t('ioda.signals.telescopeLabel')}
                  description={t('ioda.signals.telescopeDescription')}
                  color="#dc2626"
                  className="h-[220px] sm:h-full"
                />
              )}
              <div className="h-[220px] sm:h-full bg-umbral-charcoal border border-umbral-ash rounded-lg overflow-hidden">
                <OutageEventList events={events} loading={loading} />
              </div>
            </div>
          </div>

          {/* Right 1/3: connectivity map + outage scores */}
          <div className="flex flex-col gap-4">
            <div className="bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-signal-teal shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-umbral-muted">
                  {t('ioda.subnational.mapLabel')}
                </span>
              </div>
              <VenezuelaMap
                scores={outageScores}
                hoveredState={hoveredState}
                onHoverState={setHoveredState}
                loading={outageResult.loading}
              />
            </div>

            <div className="bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-signal-amber shrink-0" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-umbral-muted">
                  {t('ioda.subnational.outageScores')}
                </span>
              </div>
              <OutageScoreList
                scores={scoresList}
                hoveredState={hoveredState}
                onHoverState={setHoveredState}
                loading={outageResult.loading}
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between text-[10px] font-mono text-umbral-muted pt-2 border-t border-umbral-ash/30">
          <span>{t('ioda.monitor.source')}</span>
          <span>
            {lastUpdated
              ? `${t('common.lastUpdated')}: ${lastUpdated.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`
              : t('ioda.monitor.notYetUpdated')}
          </span>
        </div>
      </div>
    </div>
  )
}
