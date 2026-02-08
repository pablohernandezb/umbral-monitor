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
  ReferenceArea,
} from 'recharts'
import { useTranslation } from '@/i18n'
import type { RegimeHistory, HistoricalEpisode } from '@/types'

interface TrajectoryChartProps {
  data: RegimeHistory[]
  episodes?: HistoricalEpisode[]
  onYearClick?: (year: number) => void
  height?: number
  showEpisodes?: boolean
}

// Episode background colors (subtle)
const episodeColors: Record<string, string> = {
  autocracy: 'rgba(220, 38, 38, 0.05)',
  democracy: 'rgba(59, 130, 246, 0.05)',
  transition: 'rgba(245, 158, 11, 0.05)',
}

export function TrajectoryChart({
  data,
  episodes = [],
  onYearClick,
  height = 400,
  showEpisodes = true,
}: TrajectoryChartProps) {
  const { t, locale } = useTranslation()
  const [activeYear, setActiveYear] = useState<number | null>(null)

  const chartData = useMemo(() => {
    return data.map((item) => ({
      year: item.year,
      edi: item.electoral_democracy_index,
      episode: item.episode_type,
      notes: item.notes,
    }))
  }, [data])

  const handleClick = (data: { activePayload?: Array<{ payload: { year: number } }> }) => {
    if (data?.activePayload?.[0] && onYearClick) {
      onYearClick(data.activePayload[0].payload.year)
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: Array<{ value: number; dataKey: string }>
    label?: number
  }) => {
    if (!active || !payload?.length) return null

    const edi = payload.find(p => p.dataKey === 'edi')?.value
    const dataPoint = chartData.find(d => d.year === label)

    return (
      <div className="bg-umbral-charcoal border border-umbral-steel rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold font-mono mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-umbral-muted">{t('landing.trajectory.electoralDemocracyIndex')}:</span>{' '}
            <span className="text-signal-teal font-mono">{edi?.toFixed(3)}</span>
          </p>
          {dataPoint?.notes && (
            <p className="text-xs text-signal-amber mt-2">{dataPoint?.notes ? t(dataPoint.notes) : ''}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="ediGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="year"
            stroke="#6b6b76"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#3a3a42' }}
            tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
          />

          <YAxis
            domain={[0, 0.8]}
            stroke="#6b6b76"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toFixed(1)}
            tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Episode reference areas */}
          {showEpisodes && episodes.map((episode) => (
            <ReferenceArea
              key={episode.id}
              x1={episode.start_year}
              x2={episode.end_year || new Date().getFullYear()}
              fill={episodeColors[episode.episode_type] || 'transparent'}
              fillOpacity={1}
            />
          ))}

          {/* Key year markers */}
          <ReferenceLine
            x={1936}
            stroke="#2291c5"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={1948}
            stroke="#2291c5"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={1949}
            stroke="#e94b4b"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={1958}
            stroke="#2291c5"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={1961}
            stroke="#2291c5"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={1998}
            stroke="#e94b4b"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            x={2018}
            stroke="#e94b4b"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />

          <Area
            type="monotone"
            dataKey="edi"
            stroke="#14b8a6"
            strokeWidth={2}
            fill="url(#ediGradient)"
            dot={false}
            activeDot={{
              r: 6,
              fill: '#14b8a6',
              stroke: '#0a0a0b',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
