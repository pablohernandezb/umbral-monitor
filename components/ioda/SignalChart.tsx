'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { NormalizedSignalPoint, IODAOutageEvent } from '@/types/ioda'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SingleSignalChartProps {
  data: NormalizedSignalPoint[]
  events: IODAOutageEvent[]
  dataKey: 'bgp' | 'probing' | 'telescope'
  label: string
  description: string
  color: string
  /** Fixed pixel height. Omit to fill the parent container via flex. */
  height?: number
  /** Extra classes applied to the outer card div (e.g. "h-full"). */
  className?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

function xAxisTickFormatter(value: string, index: number, total: number): string {
  const step = Math.max(1, Math.floor(total / 6))
  return index % step === 0 ? value : ''
}

// ── Tooltip ────────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  color,
  signalLabel,
}: {
  active?: boolean
  payload?: Array<{ value: number | null }>
  label?: string
  color: string
  signalLabel: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value

  return (
    <div className="rounded border border-umbral-ash bg-umbral-black/95 backdrop-blur-sm px-2.5 py-1.5 shadow-xl text-[10px] font-mono">
      <p className="text-umbral-muted mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-umbral-light">{signalLabel}:</span>
        <span className="text-white font-bold">
          {value !== null && value !== undefined ? formatCompact(value) : '—'}
        </span>
      </div>
    </div>
  )
}

// ── Stats strip ────────────────────────────────────────────────────────────

function SignalStats({
  data,
  dataKey,
  color,
}: {
  data: NormalizedSignalPoint[]
  dataKey: 'bgp' | 'probing' | 'telescope'
  color: string
}) {
  const { current, pctChange } = useMemo(() => {
    const values = data.map(p => p[dataKey]).filter((v): v is number => v !== null)
    if (values.length === 0) return { current: null, pctChange: null }
    const current = values[values.length - 1]
    const baseline = values.slice(0, Math.max(1, Math.floor(values.length * 0.2)))
    const avg = baseline.reduce((a, b) => a + b, 0) / baseline.length
    const pctChange = avg !== 0 ? ((current - avg) / avg) * 100 : null
    return { current, pctChange }
  }, [data, dataKey])

  if (current === null) return <span className="text-umbral-muted text-[10px] font-mono">No data</span>

  const isDown = pctChange !== null && pctChange < -5
  const isUp   = pctChange !== null && pctChange >  5

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-base font-bold font-mono" style={{ color }}>
        {formatCompact(current)}
      </span>
      {pctChange !== null && (
        <span className={`text-[10px] font-mono ${isDown ? 'text-signal-red' : isUp ? 'text-signal-teal' : 'text-umbral-muted'}`}>
          {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

// ── Single-signal chart ────────────────────────────────────────────────────

export function SignalChart({
  data,
  events,
  dataKey,
  label,
  description,
  color,
  height,
  className,
}: SingleSignalChartProps) {
  const gradientId = `grad-${dataKey}`
  // When no fixed height is given, fill the flex parent
  const fillParent = height === undefined

  // Deduplicate outage reference lines
  const outageTimestamps = useMemo(
    () => [...new Set(events.map(e => e.start))],
    [events]
  )

  const hasData = data.some(p => p[dataKey] !== null)

  return (
    <div className={cn('bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 flex flex-col gap-2', className)}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-umbral-muted">{label}</span>
          </div>
          <p className="text-[9px] font-mono text-umbral-muted/60 pl-3.5">{description}</p>
        </div>
        <SignalStats data={data} dataKey={dataKey} color={color} />
      </div>

      {/* Chart area — flex-1 + min-h-0 lets it fill the card when no fixed height is set */}
      {!hasData ? (
        <div
          style={fillParent ? undefined : { height }}
          className={cn('flex items-center justify-center', fillParent && 'flex-1 min-h-0')}
        >
          <span className="text-[10px] font-mono text-umbral-muted">No {label} data available</span>
        </div>
      ) : (
        <div className={cn(fillParent && 'flex-1 min-h-0')}>
        <ResponsiveContainer width="100%" height={fillParent ? '100%' : height}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fill: '#4b5563', fontSize: 8, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string, index: number) =>
                xAxisTickFormatter(value, index, data.length)
              }
            />

            <YAxis
              tick={{ fill: '#4b5563', fontSize: 8, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={formatCompact}
            />

            <Tooltip
              content={
                <ChartTooltip color={color} signalLabel={label} />
              }
              cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.3 }}
            />

            {/* Outage reference lines */}
            {outageTimestamps.map((ts) => {
              const closest = data.reduce((prev, cur) =>
                Math.abs(cur.timestamp - ts) < Math.abs(prev.timestamp - ts) ? cur : prev
              )
              return (
                <ReferenceLine
                  key={ts}
                  x={closest.time}
                  stroke="#dc2626"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  strokeOpacity={0.7}
                />
              )
            })}

            <Area
              type="monotone"
              dataKey={dataKey}
              name={label}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
