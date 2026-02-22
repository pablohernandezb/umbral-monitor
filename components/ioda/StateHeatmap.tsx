'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useTranslation } from '@/i18n'
import { VENEZUELA_STATES } from '@/data/venezuela-states'
import { severityColor } from '@/lib/ioda'
import type { RegionSignalData, StateOutageScore } from '@/types/ioda'

interface StateHeatmapProps {
  regions: RegionSignalData[]
  hoveredState: string | null
  onHoverState: (code: string | null) => void
  outageScores?: Map<string, StateOutageScore>
  loading?: boolean
}

interface Tooltip {
  x: number  // px from left of canvas
  y: number  // px from top of canvas (row top)
  text: string
}

function hexComponents(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function formatTime(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString('en-US', {
    timeZone: 'America/Caracas',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatTimeAxis(epoch: number, includeDate: boolean): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Caracas',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
  if (includeDate) opts.weekday = 'short'
  return new Date(epoch * 1000).toLocaleString('en-US', opts)
}

const ROW_HEIGHT = 22

export function StateHeatmap({ regions, hoveredState, onHoverState, outageScores, loading }: StateHeatmapProps) {
  const { locale } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const sortedRegions = useMemo(() => {
    const regionMap = new Map(regions.map((r) => [r.regionCode, r]))
    return [...VENEZUELA_STATES]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((state) => ({ state, data: regionMap.get(state.code) }))
  }, [regions])

  // Per-state normalization — each state relative to its own signal range
  const stateRanges = useMemo(() => {
    return sortedRegions.map(({ data }) => {
      if (!data || data.values.length === 0) return { min: 0, max: 1 }
      let min = Infinity, max = -Infinity
      for (const v of data.values) {
        if (v !== null) {
          if (v < min) min = v
          if (v > max) max = v
        }
      }
      return {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 1 : max,
      }
    })
  }, [sortedRegions])

  const { binned, numCols, timeLabels, colEpochs } = useMemo(() => {
    const maxVals = Math.max(...regions.map((r) => r.values.length), 1)
    const TARGET_COLS = Math.min(maxVals, 96)
    const binSize = Math.max(1, Math.ceil(maxVals / TARGET_COLS))
    const actualCols = Math.ceil(maxVals / binSize)

    const binned = sortedRegions.map(({ data }) => {
      if (!data || data.values.length === 0) return new Array(actualCols).fill(null) as (number | null)[]
      const result: (number | null)[] = []
      for (let bin = 0; bin < actualCols; bin++) {
        const start = bin * binSize
        const end = Math.min(start + binSize, data.values.length)
        let sum = 0, count = 0
        for (let i = start; i < end; i++) {
          const v = data.values[i]
          if (v !== null) { sum += v; count++ }
        }
        result.push(count > 0 ? sum / count : null)
      }
      return result
    })

    // Epoch for each column — used by tooltip
    const colEpochs: number[] = []
    if (regions.length > 0 && regions[0].values.length > 0) {
      const first = regions[0]
      for (let col = 0; col < actualCols; col++) {
        colEpochs.push(first.from + col * binSize * first.step)
      }
    }

    // Time axis labels
    const timeLabels: { col: number; label: string }[] = []
    if (colEpochs.length > 0) {
      for (let i = 0; i < 8; i++) {
        const col = Math.floor((i / 7) * (actualCols - 1))
        timeLabels.push({ col, label: formatTimeAxis(colEpochs[col], i % 4 === 0) })
      }
    }

    return { binned, numCols: actualCols, timeLabels, colEpochs }
  }, [sortedRegions, regions])

  // Keep binned + colEpochs in a ref for access from mouse handler without redeclaring it as a dep
  const binnedRef = useRef(binned)
  binnedRef.current = binned
  const colEpochsRef = useRef(colEpochs)
  colEpochsRef.current = colEpochs
  const numColsRef = useRef(numCols)
  numColsRef.current = numCols

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container || regions.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const totalW = container.clientWidth
    const numRows = sortedRegions.length
    const gridHeight = ROW_HEIGHT * numRows
    const totalH = gridHeight + 20

    canvas.width = totalW * dpr
    canvas.height = totalH * dpr
    canvas.style.width = `${totalW}px`
    canvas.style.height = `${totalH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, totalW, totalH)

    const cellW = totalW / numCols

    sortedRegions.forEach(({ state }, rowIdx) => {
      const values = binned[rowIdx]
      const y = rowIdx * ROW_HEIGHT
      const isHovered = hoveredState === state.code
      const hasHover = hoveredState !== null
      const hasData = values.some((v) => v !== null)

      const { min: sMin, max: sMax } = stateRanges[rowIdx]
      const sRange = sMax - sMin || 1

      const score = outageScores?.get(state.code)
      const sevHex = score ? severityColor(score.severity) : '#14b8a6'
      const baseAlpha = isHovered ? 1 : hasHover ? 0.35 : 0.85
      const [r, g, b] = hexComponents(sevHex)

      // Row background
      ctx.fillStyle = '#111113'
      ctx.fillRect(0, y, totalW, ROW_HEIGHT - 1)

      // Block heatmap cells — brightness encodes signal intensity
      values.forEach((val, colIdx) => {
        if (val === null) return
        const x = colIdx * cellW
        const ratio = Math.max(0, Math.min(1, (val - sMin) / sRange))
        const cellAlpha = baseAlpha * (0.08 + ratio * 0.92)
        ctx.fillStyle = `rgba(${r},${g},${b},${cellAlpha})`
        ctx.fillRect(x, y, Math.ceil(cellW) + 0.5, ROW_HEIGHT - 1)
      })

      // No-data label
      if (!hasData) {
        ctx.font = '8px "JetBrains Mono", monospace'
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(184,184,196,0.3)'
        ctx.fillText('n/d', totalW - 4, y + ROW_HEIGHT / 2)
      }

      // Hover border
      if (isHovered) {
        ctx.strokeStyle = hasData ? `rgba(${r},${g},${b},0.5)` : 'rgba(184,184,196,0.3)'
        ctx.lineWidth = 1
        ctx.strokeRect(0, y, totalW, ROW_HEIGHT - 1)
      }

      // State label overlay
      ctx.font = `${isHovered ? 'bold ' : ''}9px "JetBrains Mono", monospace`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(0, y, 90, ROW_HEIGHT - 1)
      ctx.fillStyle = hasData
        ? (isHovered ? '#ffffff' : '#c0c0c8')
        : 'rgba(184,184,196,0.45)'
      ctx.fillText(state.name, 4, y + ROW_HEIGHT / 2)
    })

    // Time axis
    ctx.font = '8px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#b8b8c4'
    timeLabels.forEach(({ col, label }) => {
      ctx.fillText(label, col * cellW, numRows * ROW_HEIGHT + 4)
    })

  }, [sortedRegions, binned, numCols, stateRanges, outageScores, hoveredState, timeLabels, regions.length])

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top
      const rowIdx = Math.floor(relY / ROW_HEIGHT)

      if (rowIdx < 0 || rowIdx >= sortedRegions.length) {
        onHoverState(null)
        setTooltip(null)
        return
      }

      onHoverState(sortedRegions[rowIdx].state.code)

      const colIdx = Math.min(
        Math.floor((relX / rect.width) * numColsRef.current),
        numColsRef.current - 1
      )
      const val = binnedRef.current[rowIdx]?.[colIdx] ?? null
      const epoch = colEpochsRef.current[colIdx]
      const stateName = sortedRegions[rowIdx].state.name

      if (val !== null && epoch) {
        setTooltip({
          x: relX,
          y: rowIdx * ROW_HEIGHT,
          text: `${stateName}  ·  ${formatTime(epoch)}  ·  ${val % 1 === 0 ? val : val.toFixed(1)}`,
        })
      } else {
        setTooltip({
          x: relX,
          y: rowIdx * ROW_HEIGHT,
          text: `${stateName}  ·  no data for this datasource`,
        })
      }
    },
    [onHoverState, sortedRegions]
  )

  const handleMouseLeave = useCallback(() => {
    onHoverState(null)
    setTooltip(null)
  }, [onHoverState])

  if (loading) {
    return (
      <div className="space-y-0.5">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="h-[22px] bg-umbral-ash/10 rounded-sm animate-pulse" />
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
      {/* Severity legend */}
      <div className="flex items-center gap-3 mb-2 px-1">
        <span className="text-[9px] font-mono uppercase tracking-wider text-umbral-muted">
          {locale === 'es' ? 'Severidad:' : 'Severity:'}
        </span>
        {([
          { hex: '#14b8a6', label: locale === 'es' ? 'Normal'    : 'Normal'   },
          { hex: '#f59e0b', label: locale === 'es' ? 'Degradado' : 'Degraded' },
          { hex: '#dc2626', label: locale === 'es' ? 'Crítico'   : 'Critical' },
        ] as const).map(({ hex, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block w-6 h-0.5 rounded-full" style={{ backgroundColor: hex }} />
            <span className="text-[9px] font-mono text-umbral-muted">{label}</span>
          </span>
        ))}
        <span className="text-[9px] font-mono text-umbral-muted ml-auto">
          {locale === 'es' ? '↕ relativo al estado' : '↕ relative to state'}
        </span>
      </div>

      {/* Canvas + tooltip overlay */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 px-2 py-1 rounded text-[9px] font-mono text-white bg-umbral-black/90 border border-umbral-steel/50 whitespace-nowrap"
            style={{
              left: Math.min(tooltip.x + 8, (containerRef.current?.clientWidth ?? 400) - 280),
              top: tooltip.y - 24,
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  )
}
