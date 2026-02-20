'use client'

import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { formatEpoch, formatDuration } from '@/lib/ioda'
import { SCORE_THRESHOLDS } from '@/types/ioda'
import type { IODAOutageEvent } from '@/types/ioda'

interface OutageEventListProps {
  events: IODAOutageEvent[]
  loading: boolean
  className?: string
}

const DS_COLORS: Record<string, string> = {
  'bgp':         'border-signal-amber/40 bg-signal-amber/10 text-signal-amber',
  'ping-slash24': 'border-signal-blue/40 bg-signal-blue/10 text-signal-blue',
  'ucsd-nt':     'border-signal-red/40 bg-signal-red/10 text-signal-red',
  'merit-nt':    'border-signal-red/40 bg-signal-red/10 text-signal-red',
}

function severityColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.medium) return 'bg-signal-red'
  if (score >= SCORE_THRESHOLDS.low)    return 'bg-signal-amber'
  return 'bg-signal-teal'
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <div className="w-24 h-3 bg-umbral-ash/40 rounded" />
          <div className="w-12 h-3 bg-umbral-ash/30 rounded" />
          <div className="w-16 h-5 bg-umbral-ash/30 rounded-full" />
          <div className="flex-1 h-2 bg-umbral-ash/20 rounded-full ml-auto" />
        </div>
      ))}
    </>
  )
}

export function OutageEventList({ events, loading, className }: OutageEventListProps) {
  const { t } = useTranslation()

  const dsLabel = (datasource: string): string => {
    if (datasource === 'bgp')          return t('ioda.signals.bgpLabel')
    if (datasource === 'ping-slash24') return t('ioda.signals.probingLabel')
    if (datasource === 'ucsd-nt' || datasource === 'merit-nt') return t('ioda.signals.telescopeLabel')
    return datasource
  }

  const severityLabel = (score: number): string => {
    if (score >= SCORE_THRESHOLDS.medium) return t('ioda.events.severityCritical')
    if (score >= SCORE_THRESHOLDS.low)    return t('ioda.events.severityMedium')
    return t('ioda.events.severityLow')
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="px-3 py-2 border-b border-umbral-ash/40 flex items-center justify-between">
        <span className="text-[10px] font-mono text-umbral-muted uppercase tracking-wider">
          {t('ioda.events.title')}
        </span>
        <span className="text-[10px] font-mono text-umbral-muted">
          {!loading && t('ioda.events.detected', { count: events.length })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-umbral-ash/20">
        {loading ? (
          <SkeletonRows />
        ) : events.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
            <CheckCircle className="w-8 h-8 text-signal-teal" />
            <div>
              <p className="text-sm text-white font-medium">{t('ioda.events.noOutages')}</p>
              <p className="text-xs text-umbral-muted mt-1">
                {t('ioda.events.noOutagesSubtitle')}
              </p>
            </div>
          </div>
        ) : (
          events
            .sort((a, b) => b.start - a.start)
            .map((event, i) => {
              const barWidth = Math.min((event.score / 1000) * 100, 100)

              return (
                <div
                  key={`${event.datasource}-${event.start}-${i}`}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-umbral-ash/10 transition-colors group"
                >
                  {/* Start time */}
                  <div className="shrink-0 w-28">
                    <p className="text-[10px] font-mono text-umbral-muted">
                      {formatEpoch(event.start, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <p className="text-[10px] font-mono text-umbral-steel mt-0.5">
                      {formatDuration(event.duration)}
                    </p>
                  </div>

                  {/* Datasource badge */}
                  <span
                    className={cn(
                      'shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase tracking-wider',
                      DS_COLORS[event.datasource] ?? 'border-umbral-ash text-umbral-muted bg-umbral-ash/10'
                    )}
                  >
                    {dsLabel(event.datasource)}
                  </span>

                  {/* Severity bar + label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-mono text-umbral-muted uppercase">
                        {severityLabel(event.score)}
                      </span>
                      <span className="text-[9px] font-mono text-umbral-muted">
                        {event.score.toFixed(0)}
                      </span>
                    </div>
                    <div className="h-1 bg-umbral-ash/40 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', severityColor(event.score))}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}
