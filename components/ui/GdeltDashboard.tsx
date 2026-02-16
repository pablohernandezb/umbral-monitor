'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, TrendingDown, TrendingUp, Radio } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { GdeltSignalChart } from '@/components/charts/GdeltSignalChart'
import { GDELT_ANNOTATIONS, TIER_COLORS } from '@/data/gdelt-annotations'
import { mockGdeltData } from '@/data/gdelt-mock'
import type { GdeltDataPoint, GdeltApiResponse } from '@/types/gdelt'

export function GdeltDashboard() {
  const { t, locale } = useTranslation()
  const [data, setData] = useState<GdeltDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const res = await fetch('/api/gdelt')
        const json: GdeltApiResponse = await res.json()

        if (cancelled) return

        if (json.data && json.data.length > 0) {
          setData(json.data)
          setFetchedAt(json.fetchedAt)
          if (json.error) setError(json.error)
        } else {
          // Fallback to mock data
          setData(mockGdeltData)
          setError('mock')
        }
      } catch {
        if (cancelled) return
        setData(mockGdeltData)
        setError('mock')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  // Compute stat metrics
  const stats = useMemo(() => {
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

    const latestPoint = data[data.length - 1]
    const currentTone = latestPoint?.tone ?? null

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
  }, [data])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

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
            <span className="px-2 py-0.5 bg-signal-amber/10 border border-signal-amber/30 rounded text-[10px] font-mono text-signal-amber">
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
              <GdeltSignalChart data={data} height={250} />
            </div>
            <div className="hidden md:block">
              <GdeltSignalChart data={data} height={350} />
            </div>

            {/* Event timeline */}
            <div>
              <h4 className="text-xs font-semibold text-umbral-muted font-mono uppercase tracking-wider mb-3">
                {t('gdelt.timeline.title')}
              </h4>
              <div className="space-y-1">
                {GDELT_ANNOTATIONS.map((annotation, i) => (
                  <div
                    key={annotation.date}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-umbral-ash/20 transition-colors group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-offset-umbral-black"
                      style={{
                        backgroundColor: TIER_COLORS[annotation.tier],
                        boxShadow: `0 0 6px ${TIER_COLORS[annotation.tier]}40`,
                      }}
                    />
                    <span className="text-xs font-mono text-umbral-muted w-24 shrink-0">
                      {formatDate(annotation.date)}
                    </span>
                    <span className="text-xs text-umbral-light group-hover:text-white transition-colors">
                      {locale === 'es' ? annotation.label_es : annotation.label_en}
                    </span>
                    <span
                      className="text-[9px] font-mono ml-auto shrink-0 opacity-60"
                      style={{ color: TIER_COLORS[annotation.tier] }}
                    >
                      {annotation.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-umbral-muted pt-2 border-t border-umbral-ash/30">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                {t('gdelt.source')}
              </span>
              {fetchedAt && (
                <span className="font-mono">
                  {new Date(fetchedAt).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
