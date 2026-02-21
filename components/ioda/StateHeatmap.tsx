'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from '@/i18n'
import { VENEZUELA_STATES } from '@/data/venezuela-states'
import type { RegionSignalData } from '@/types/ioda'

interface StateHeatmapProps {
  regions: RegionSignalData[]
  hoveredState: string | null
  onHoverState: (code: string | null) => void
  loading?: boolean
}

/** Map normalised ratio [0..1] → teal RGB */
function ratioToRgb(ratio: number): [number, number, number] {
  const r = Math.round(13 + ratio * (20 - 13))
  const g = Math.round(31 + ratio * (184 - 31))
  const b = Math.round(29 + ratio * (166 - 29))
  return [r, g, b]
}

function formatTime(epoch: number, includeDate?: boolean): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
  if (includeDate) {
    opts.weekday = 'short'
  }
  return new Date(epoch * 1000).toLocaleString('en-US', opts)
}

export function StateHeatmap({ regions, hoveredState, onHoverState, loading }: StateHeatmapProps) {
  const { locale } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)

  // Sort regions alphabetically to match IODA
  const sortedRegions = useMemo(() => {
    const regionMap = new Map(regions.map((r) => [r.regionCode, r]))
    return [...VENEZUELA_STATES]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((state) => ({
        state,
        data: regionMap.get(state.code),
      }))
  }, [regions])

  // Global min/max for color normalization
  const { globalMin, globalMax } = useMemo(() => {
    let min = Infinity
    let max = -Infinity
    for (const r of regions) {
      for (const v of r.values) {
        if (v !== null) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }
    }
    return { globalMin: min === Infinity ? 0 : min, globalMax: max === -Infinity ? 1 : max }
  }, [regions])

  // Downsample into a fixed-width grid
  const { binned, numCols, timeLabels } = useMemo(() => {
    const maxVals = Math.max(...regions.map((r) => r.values.length), 1)
    // Target: one pixel column per ~5 min (raw step). Cap at a reasonable max.
    const TARGET_COLS = Math.min(maxVals, 288) // 288 = 24h at 5min
    const binSize = Math.max(1, Math.ceil(maxVals / TARGET_COLS))
    const actualCols = Math.ceil(maxVals / binSize)

    const binned = sortedRegions.map(({ data }) => {
      if (!data || data.values.length === 0) return new Array(actualCols).fill(null) as (number | null)[]
      const result: (number | null)[] = []
      for (let bin = 0; bin < actualCols; bin++) {
        const start = bin * binSize
        const end = Math.min(start + binSize, data.values.length)
        let sum = 0
        let count = 0
        for (let i = start; i < end; i++) {
          const v = data.values[i]
          if (v !== null) { sum += v; count++ }
        }
        result.push(count > 0 ? sum / count : null)
      }
      return result
    })

    // Time labels along bottom: ~8 labels evenly spaced
    const timeLabels: { col: number; label: string }[] = []
    if (regions.length > 0 && regions[0].values.length > 0) {
      const first = regions[0]
      const NUM_LABELS = 8
      for (let i = 0; i < NUM_LABELS; i++) {
        const col = Math.floor((i / (NUM_LABELS - 1)) * (actualCols - 1))
        const epoch = first.from + col * binSize * first.step
        timeLabels.push({ col, label: formatTime(epoch, i % 4 === 0) })
      }
    }

    return { binned, numCols: actualCols, timeLabels }
  }, [sortedRegions, regions])

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || regions.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const containerWidth = container.clientWidth

    const ROW_HEIGHT = 18
    const TIME_AXIS_HEIGHT = 20
    const numRows = sortedRegions.length
    const gridHeight = ROW_HEIGHT * numRows
    const totalH = gridHeight + TIME_AXIS_HEIGHT
    const totalW = containerWidth

    canvas.width = totalW * dpr
    canvas.height = totalH * dpr
    canvas.style.width = `${totalW}px`
    canvas.style.height = `${totalH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, totalW, totalH)

    const cellW = totalW / numCols
    const range = globalMax - globalMin || 1

    // Draw each row (state)
    sortedRegions.forEach(({ state }, rowIdx) => {
      const values = binned[rowIdx]
      const y = rowIdx * ROW_HEIGHT
      const isHovered = hoveredState === state.code
      const hasHover = hoveredState !== null

      // Draw heatmap cells for this row
      values.forEach((val, colIdx) => {
        const x = colIdx * cellW

        if (val === null) {
          ctx.fillStyle = '#111113'
        } else {
          const ratio = Math.max(0, Math.min(1, (val - globalMin) / range))
          const [r, g, b] = ratioToRgb(ratio)
          const alpha = isHovered ? 1 : hasHover ? 0.35 : 0.85
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        }

        ctx.fillRect(x, y, Math.ceil(cellW), ROW_HEIGHT - 1)
      })

      // Highlight border for hovered row
      if (isHovered) {
        ctx.strokeStyle = '#14b8a680'
        ctx.lineWidth = 1
        ctx.strokeRect(0, y, totalW, ROW_HEIGHT - 1)
      }

      // Overlay state name on left edge of each row
      ctx.font = `${isHovered ? 'bold ' : ''}9px "JetBrains Mono", monospace`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      // Text shadow for readability
      ctx.fillStyle = '#000000'
      ctx.globalAlpha = 0.7
      ctx.fillRect(0, y, 90, ROW_HEIGHT - 1)
      ctx.globalAlpha = 1

      ctx.fillStyle = isHovered ? '#ffffff' : '#c0c0c8'
      ctx.fillText(state.name, 4, y + ROW_HEIGHT / 2)
    })

    // Draw time axis at the bottom
    ctx.font = '8px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#4b5563'
    timeLabels.forEach(({ col, label }) => {
      const x = col * cellW
      ctx.fillText(label, x, gridHeight + 4)
    })

  }, [sortedRegions, binned, numCols, globalMin, globalMax, hoveredState, timeLabels, regions.length])

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  // Detect which row is hovered
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const y = e.clientY - rect.top
      const ROW_HEIGHT = 18
      const rowIdx = Math.floor(y / ROW_HEIGHT)

      if (rowIdx >= 0 && rowIdx < sortedRegions.length) {
        onHoverState(sortedRegions[rowIdx].state.code)
      } else {
        onHoverState(null)
      }
    },
    [onHoverState, sortedRegions]
  )

  const handleMouseLeave = useCallback(() => {
    onHoverState(null)
  }, [onHoverState])

  if (loading) {
    return (
      <div className="space-y-0.5">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="h-[18px] bg-umbral-ash/10 rounded-sm animate-pulse" />
        ))}
      </div>
    )
  }

  if (regions.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-xs font-mono text-umbral-muted">
        {locale === 'es' ? 'Sin datos regionales' : 'No regional data'}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}
