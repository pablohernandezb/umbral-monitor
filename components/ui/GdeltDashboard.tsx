'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, TrendingDown, TrendingUp, Radio } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { GdeltSignalChart } from '@/components/charts/GdeltSignalChart'
import { TIER_COLORS } from '@/data/gdelt-annotations'
import { mockGdeltData } from '@/data/gdelt-mock'
import { getGdeltEvents } from '@/lib/data'
import type { GdeltDataPoint, GdeltApiResponse, GdeltEvent, GdeltSignalKey } from '@/types/gdelt'

// Signals refresh daily; anything older than this is not "live".
const STALE_AFTER_DAYS = 2

export function GdeltDashboard() {
  const { t, locale } = useTranslation()
  const [data, setData] = useState<GdeltDataPoint[]>([])
  const [events, setEvents] = useState<GdeltEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [latestDataDate, setLatestDataDate] = useState<string | null>(null)
  const [stalenessDays, setStalenessDays] = useState<number | null>(null)
  const [stalestSignal, setStalestSignal] = useState<GdeltSignalKey | null>(null)
  const [signalLastDates, setSignalLastDates] =
    useState<Record<GdeltSignalKey, string | null> | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const [gdeltRes, eventsRes] = await Promise.allSettled([
          fetch('/api/gdelt').then(r => r.json() as Promise<GdeltApiResponse>),
          getGdeltEvents(),
        ])

        if (cancelled) return

        if (gdeltRes.status === 'fulfilled') {
          const json = gdeltRes.value
          if (json.data && json.data.length > 0) {
            setData(json.data)
            setFetchedAt(json.fetchedAt)
            setLatestDataDate(json.latestDataDate ?? null)
            setStalenessDays(json.stalenessDays ?? null)
            setStalestSignal(json.stalestSignal ?? null)
            setSignalLastDates(json.signalLastDates ?? null)
            if (json.error) setError(json.error)
          } else {
            setData(mockGdeltData)
            setError('mock')
          }
        } else {
          setData(mockGdeltData)
          setError('mock')
        }

        if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
          setEvents(eventsRes.value.data)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  // The three signals advance independently — a refresh run touches one signal
  // at a time, so they routinely end on different dates. Charting the raw series
  // then draws a ragged edge where the lagging signals simply stop, which reads
  // as "conflict spiked while tone and attention collapsed" rather than "we
  // haven't fetched those yet". It also corrupts the stat cards: the averages
  // below coerce missing values with `?? 0`, so trailing gaps drag tone and
  // attention toward zero exactly when the data is least complete.
  //
  // So the display ends at the newest date where ALL THREE signals are present.
  // The archive and the daily fetch are untouched — every signal keeps being
  // collected in full; this only bounds what the panel draws.
  const displayData = useMemo(() => {
    if (data.length === 0) return data

    let lastComplete = -1
    for (let i = data.length - 1; i >= 0; i--) {
      const d = data[i]
      if (d.instability !== null && d.tone !== null && d.artvolnorm !== null) {
        lastComplete = i
        break
      }
    }

    // No date has all three (e.g. a signal has never been fetched). Rendering
    // nothing would hide the data we do have, so fall back to the full series —
    // the stale badge already reports which signal is missing.
    if (lastComplete === -1) return data

    return data.slice(0, lastComplete + 1)
  }, [data])

  /** Coverage end actually drawn — what the footer should report. */
  const displayThrough = displayData.length > 0
    ? displayData[displayData.length - 1].date
    : latestDataDate

  // Compute stat metrics
  const stats = useMemo(() => {
    const data = displayData
    if (data.length === 0) return { instabilityDelta: null, currentTone: null, phase: null as 'CRISIS' | 'ELEVATED' | 'STABLE' | null }

    // Baseline: first 30 data points (~ Dec 2025)
    const baseline = data.slice(0, 30)
    const baselineAvg = baseline.reduce((sum, d) => sum + (d.instability ?? 0), 0) / baseline.length

    // Recent: last 14 data points
    const recent = data.slice(-14)
    const recentAvg = recent.reduce((sum, d) => sum + (d.instability ?? 0), 0) / recent.length

    const instabilityDelta = baselineAvg > 0
      ? ((recentAvg - baselineAvg) / baselineAvg) * 100
      : null

    const lastWithTone = [...data].reverse().find(d => d.tone !== null)
    const currentTone = lastWithTone?.tone ?? null

    // Composite phase from recent data (last 14 points)
    // Normalize each signal to 0–1 pressure scale, then average
    const recentInstability = recent.reduce((s, d) => s + (d.instability ?? 0), 0) / recent.length
    const recentTone = recent.reduce((s, d) => s + (d.tone ?? 0), 0) / recent.length
    const recentAttention = recent.reduce((s, d) => s + (d.artvolnorm ?? 0), 0) / recent.length

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
    const instPressure = clamp(recentInstability / 6, 0, 1)       // 0–6+ range
    const tonePressure = clamp((-recentTone) / 8, 0, 1)           // 0 to -8+ (more negative = higher pressure)
    const attentionPressure = clamp(recentAttention / 4, 0, 1)    // 0–4+ range

    const composite = (instPressure + tonePressure + attentionPressure) / 3
    const phase: 'CRISIS' | 'ELEVATED' | 'STABLE' = composite > 0.6 ? 'CRISIS' : composite > 0.35 ? 'ELEVATED' : 'STABLE'

    return { instabilityDelta, currentTone, phase }
  }, [displayData])

  // Only meaningful for real data — mock mode has its own badge.
  const isStale =
    error !== 'mock' && stalenessDays !== null && stalenessDays > STALE_AFTER_DAYS

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Names the lagging signal and lists every signal's end date, so a partly
  // frozen chart is diagnosable from the UI instead of only from the API.
  const staleTooltip = (() => {
    if (stalenessDays === null) return undefined
    const worst = stalestSignal
      ? `${t(`gdelt.signals.${stalestSignal}`)} — ${stalenessDays}d`
      : `${stalenessDays}d`
    const perSignal = signalLastDates
      ? (Object.keys(signalLastDates) as GdeltSignalKey[])
          .map(k => {
            const d = signalLastDates[k]
            return `${t(`gdelt.signals.${k}`)}: ${d ? formatDate(d) : '—'}`
          })
          .join('\n')
      : ''
    return [t('gdelt.staleTooltip').replace('{signal}', worst), perSignal]
      .filter(Boolean)
      .join('\n\n')
  })()

  return (
    <div className="rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-signal-teal" />
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              {t('gdelt.title')}
            </h3>
            <p className="text-[10px] text-umbral-muted mt-0.5">
              {t('gdelt.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error === 'mock' ? (
            <span className="px-2 py-0.5 bg-signal-amber/10 border border-signal-amber/30 rounded text-[10px] font-mono text-signal-amber">
              {t('gdelt.mockData')}
            </span>
          ) : error ? (
            <span
              title={error}
              className="px-2 py-0.5 bg-signal-amber/10 border border-signal-amber/30 rounded text-[10px] font-mono text-signal-amber cursor-help"
            >
              {t('gdelt.dataDelayed')}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-signal-teal">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-teal animate-pulse" />
              {t('gdelt.live')}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          /* Skeleton loading */
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-umbral-ash/30 rounded-lg" />
              ))}
            </div>
            <div className="h-[250px] md:h-[350px] bg-umbral-ash/20 rounded-lg" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-umbral-ash/20 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {/* Instability Delta */}
              <div className="bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 md:p-4">
                <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-1">
                  {t('gdelt.stats.instabilityDelta')}
                </p>
                <div className="flex items-center gap-1.5">
                  {stats.instabilityDelta !== null ? (
                    <>
                      {stats.instabilityDelta > 0 ? (
                        <TrendingUp className="w-4 h-4 text-signal-red" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-signal-teal" />
                      )}
                      <span
                        className={cn(
                          'text-lg md:text-xl font-bold font-mono',
                          stats.instabilityDelta > 0 ? 'text-signal-red' : 'text-signal-teal'
                        )}
                      >
                        {stats.instabilityDelta > 0 ? '+' : ''}{stats.instabilityDelta.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-mono text-umbral-muted">—</span>
                  )}
                </div>
                <p className="text-[9px] text-umbral-muted mt-1">{t('gdelt.stats.instabilityDeltaLabel')}</p>
              </div>

              {/* Media Tone */}
              <div className="bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 md:p-4">
                <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-1">
                  {t('gdelt.stats.currentTone')}
                </p>
                <span
                  className={cn(
                    'text-lg md:text-xl font-bold font-mono',
                    (stats.currentTone ?? 0) < -5 ? 'text-signal-red' : (stats.currentTone ?? 0) < -2 ? 'text-signal-amber' : 'text-signal-teal'
                  )}
                >
                  {stats.currentTone !== null ? stats.currentTone.toFixed(2) : '—'}
                </span>
                <p className="text-[9px] text-umbral-muted mt-1">{t('gdelt.stats.currentToneLabel')}</p>
              </div>

              {/* Composed */}
              <div className="bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 md:p-4">
                <p className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-1">
                  {t('gdelt.stats.composedSignal')}
                </p>
                <span className={cn(
                  'text-lg md:text-xl font-bold font-mono',
                  stats.phase === 'CRISIS' ? 'text-signal-red' : stats.phase === 'ELEVATED' ? 'text-signal-amber' : 'text-signal-teal'
                )}>
                  {stats.phase ? t(`gdelt.stats.composed${stats.phase}`) : '—'}
                </span>
                <p className="text-[9px] text-umbral-muted mt-1">{t('gdelt.stats.composedLabel')}</p>
              </div>
            </div>

            {/* Chart */}
            <div className="block md:hidden">
              <GdeltSignalChart data={displayData} height={250} events={events} />
            </div>
            <div className="hidden md:block">
              <GdeltSignalChart data={displayData} height={350} events={events} />
            </div>

            {/* Event timeline */}
            <div>
              <h4 className="text-xs md:text-sm font-semibold text-umbral-muted font-mono uppercase tracking-wider mb-3">
                {t('gdelt.timeline.title')}
              </h4>
              <div className="space-y-1 md:space-y-1.5">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-md hover:bg-umbral-ash/20 transition-colors group"
                  >
                    <span
                      className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-umbral-black"
                      style={{
                        backgroundColor: TIER_COLORS[event.tier_en],
                        boxShadow: `0 0 6px ${TIER_COLORS[event.tier_en]}40`,
                      }}
                    />
                    <span className="text-xs md:text-sm font-mono text-umbral-muted w-24 md:w-28 shrink-0">
                      {formatDate(event.date)}
                    </span>
                    <span className="text-xs md:text-sm text-umbral-light group-hover:text-white transition-colors">
                      {locale === 'es' ? event.label_es : event.label_en}
                    </span>
                    <span
                      className="text-[9px] md:text-xs font-mono ml-auto shrink-0 opacity-60"
                      style={{ color: TIER_COLORS[event.tier_en] }}
                    >
                      {locale === 'es' ? event.tier_es : event.tier_en}
                    </span>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-xs text-umbral-muted text-center py-3">
                    {locale === 'es' ? 'Sin eventos registrados' : 'No events recorded'}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-umbral-muted pt-2 border-t border-umbral-ash/30">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                {t('gdelt.source')}
              </span>
              <span className="flex items-center gap-3 font-mono">
                {/* Coverage end date — the number that actually tells you
                    whether the chart is current. Reports the last COMPLETE date
                    (what is drawn above), not the newest row of any single
                    signal, so the footer can never claim coverage the chart
                    doesn't show. */}
                {displayThrough && (
                  <span
                    title={staleTooltip}
                    className={cn(
                      staleTooltip && 'cursor-help',
                      isStale && 'text-signal-red'
                    )}
                  >
                    {t('gdelt.footer.dataThrough')}
                    {formatDate(displayThrough)}
                  </span>
                )}
                {fetchedAt && (
                  <span>
                    {t('gdelt.footer.lastUpdated')}
                    {new Date(fetchedAt).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
