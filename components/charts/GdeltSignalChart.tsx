'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { GDELT_ANNOTATIONS, TIER_COLORS, SIGNAL_COLORS } from '@/data/gdelt-annotations'
import type { GdeltDataPoint, GdeltSignalKey } from '@/types/gdelt'

interface GdeltSignalChartProps {
  data: GdeltDataPoint[]
  height?: number
}

export function GdeltSignalChart({ data, height = 350 }: GdeltSignalChartProps) {
  const { t, locale } = useTranslation()
  const [visibleSignals, setVisibleSignals] = useState<Record<GdeltSignalKey, boolean>>({
    instability: true,
    tone: true,
    artvolnorm: true,
  })

  const toggleSignal = (key: GdeltSignalKey) => {
    setVisibleSignals(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const annotationMap = useMemo(() => {
    const map = new Map<string, typeof GDELT_ANNOTATIONS[0]>()
    GDELT_ANNOTATIONS.forEach(a => map.set(a.date, a))
    return map
  }, [])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const signalLabels: Record<GdeltSignalKey, string> = {
    instability: t('gdelt.signals.instability'),
    artvolnorm: t('gdelt.signals.artvolnorm'),
    tone: t('gdelt.signals.tone'),
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number | null; dataKey: string; color: string }>
    label?: string
  }) => {
    if (!active || !payload?.length || !label) return null
    const annotation = annotationMap.get(label)

    return (
      <div className="bg-umbral-charcoal border border-umbral-steel rounded-lg p-3 shadow-lg max-w-xs">
        <p className="text-white font-semibold font-mono text-sm mb-2">{formatDate(label)}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs mb-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-umbral-muted">{signalLabels[entry.dataKey as GdeltSignalKey]}</span>
            <span className="text-white font-mono ml-auto">
              {entry.value != null ? entry.value.toFixed(2) : '—'}
            </span>
          </div>
        ))}
        {annotation && (
          <div className="mt-2 pt-2 border-t border-umbral-ash">
            <span className="text-xs font-mono font-bold" style={{ color: TIER_COLORS[annotation.tier_en] }}>
              {locale === 'es' ? annotation.label_es : annotation.label_en}
            </span>
          </div>
        )}
      </div>
    )
  }

  const tickInterval = Math.max(1, Math.floor(data.length / 8))

  return (
    <div>
      {/* Signal toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['instability', 'artvolnorm', 'tone'] as GdeltSignalKey[]).map(key => (
          <button
            key={key}
            onClick={() => toggleSignal(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all',
              visibleSignals[key] ? 'opacity-100' : 'opacity-30 border-umbral-steel'
            )}
            style={{
              color: SIGNAL_COLORS[key],
              borderColor: visibleSignals[key] ? SIGNAL_COLORS[key] : undefined,
            }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SIGNAL_COLORS[key] }} />
            {signalLabels[key]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gdeltInstGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff3b3b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ff3b3b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gdeltToneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3bf0ff" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3bf0ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gdeltArtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f5c842" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f5c842" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#6b6b76"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#3a3a42' }}
              tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
              tickFormatter={formatDate}
              interval={tickInterval}
            />

            <YAxis
              yAxisId="left"
              domain={[0, 'auto']}
              stroke="#6b6b76"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
              width={40}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[-10, 2]}
              stroke="#6b6b76"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
              width={40}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Annotation reference lines */}
            {GDELT_ANNOTATIONS.map(a => (
              <ReferenceLine
                key={a.date}
                x={a.date}
                yAxisId="left"
                stroke={TIER_COLORS[a.tier_en]}
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            ))}

            {/* Area series — render largest areas first so smaller ones aren't hidden */}
            {visibleSignals.artvolnorm && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="artvolnorm"
                stroke="#f5c842"
                strokeWidth={2}
                fill="url(#gdeltArtGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#f5c842', stroke: '#111113', strokeWidth: 2 }}
                connectNulls
                animationDuration={800}
              />
            )}
            {visibleSignals.instability && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="instability"
                stroke="#ff3b3b"
                strokeWidth={2}
                fill="url(#gdeltInstGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#ff3b3b', stroke: '#111113', strokeWidth: 2 }}
                connectNulls
                animationDuration={800}
              />
            )}
            {visibleSignals.tone && (
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="tone"
                stroke="#3bf0ff"
                strokeWidth={2}
                fill="url(#gdeltToneGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#3bf0ff', stroke: '#111113', strokeWidth: 2 }}
                connectNulls
                animationDuration={800}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
