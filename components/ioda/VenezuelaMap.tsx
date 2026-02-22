'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import type L from 'leaflet'
import { useTranslation } from '@/i18n'
import { IODA_CODE_BY_NAME } from '@/data/venezuela-states'
import { severityColor, formatOutageScore } from '@/lib/ioda'
import type { StateOutageScore, OutageSeverity } from '@/types/ioda'

interface VenezuelaMapProps {
  scores: Map<string, StateOutageScore>
  hoveredState: string | null
  onHoverState: (code: string | null) => void
  loading?: boolean
}

const SEVERITY_LABELS: Record<OutageSeverity, { en: string; es: string }> = {
  normal: { en: 'Normal', es: 'Normal' },
  low: { en: 'Low', es: 'Bajo' },
  degraded: { en: 'Degraded', es: 'Degradado' },
  high: { en: 'High', es: 'Alto' },
  critical: { en: 'Critical', es: 'Crítico' },
}

/** Severity → fill color with opacity for Leaflet polygons */
function severityFillColor(severity: OutageSeverity): string {
  switch (severity) {
    case 'normal': return '#14b8a6'
    case 'low': return '#14b8a6'
    case 'degraded': return '#f59e0b'
    case 'high': return '#dc2626'
    case 'critical': return '#dc2626'
  }
}

function severityFillOpacity(severity: OutageSeverity): number {
  switch (severity) {
    case 'normal': return 0.15
    case 'low': return 0.25
    case 'degraded': return 0.35
    case 'high': return 0.45
    case 'critical': return 0.6
  }
}

export function VenezuelaMap({ scores, hoveredState, onHoverState, loading }: VenezuelaMapProps) {
  const { locale } = useTranslation()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<Map<string, L.Layer>>(new Map())
  const [ready, setReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default

      if (cancelled || !mapContainerRef.current) return

      const map = L.map(mapContainerRef.current, {
        center: [7.0, -66.0],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: true,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      })

      // Dark radar-style tiles
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        { maxZoom: 8, minZoom: 4 }
      ).addTo(map)

      mapRef.current = map

      // Load GeoJSON
      const response = await fetch('/data/venezuela-geo.json')
      const geojson = await response.json()

      if (cancelled) return

      const geoLayer = L.geoJSON(geojson, {
        style: (feature) => {
          const name = feature?.properties?.shapeName as string
          const iodaCode = IODA_CODE_BY_NAME.get(name)
          const score = iodaCode ? scores.get(iodaCode) : undefined
          const isEsequiba = name === 'Guayana Esequiba'

          if (isEsequiba) {
            return {
              color: '#14b8a630',
              weight: 1,
              fillColor: '#14b8a6',
              fillOpacity: 0.05,
              dashArray: '4 4',
            }
          }

          const severity = score?.severity ?? 'normal'
          return {
            color: severityColor(severity) + '80',
            weight: 1,
            fillColor: severityFillColor(severity),
            fillOpacity: severityFillOpacity(severity),
          }
        },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.shapeName as string
          const iodaCode = IODA_CODE_BY_NAME.get(name)

          if (iodaCode) {
            layersRef.current.set(iodaCode, layer)
          }

          layer.on('mouseover', () => {
            if (iodaCode) onHoverState(iodaCode)
            ;(layer as L.Path).setStyle({ weight: 2.5, color: '#ffffff' })
          })
          layer.on('mouseout', () => {
            onHoverState(null)
            const score = iodaCode ? scores.get(iodaCode) : undefined
            const severity = score?.severity ?? 'normal'
            ;(layer as L.Path).setStyle({
              weight: 1,
              color: severityColor(severity) + '80',
            })
          })

          // Tooltip
          const isEsequiba = name === 'Guayana Esequiba'
          if (isEsequiba) {
            layer.bindTooltip('Guayana Esequiba', {
              className: 'ioda-map-tooltip',
              sticky: true,
            })
          } else if (iodaCode) {
            const score = scores.get(iodaCode)
            const severity = score?.severity ?? 'normal'
            const label = SEVERITY_LABELS[severity][locale as 'en' | 'es']
            const scoreText = score && score.score > 0 ? ` · ${formatOutageScore(score.score)}` : ''
            layer.bindTooltip(`${name} · ${label}${scoreText}`, {
              className: 'ioda-map-tooltip',
              sticky: true,
            })
          }
        },
      })

      geoLayer.addTo(map)
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      layersRef.current.clear()
    }
    // We initialize once; score changes are handled in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update styles when scores change
  useEffect(() => {
    if (!ready) return
    layersRef.current.forEach((layer, code) => {
      const score = scores.get(code)
      const severity = score?.severity ?? 'normal'
      ;(layer as L.Path).setStyle({
        fillColor: severityFillColor(severity),
        fillOpacity: severityFillOpacity(severity),
        color: severityColor(severity) + '80',
        weight: 1,
      })
    })
  }, [scores, ready])

  // Sync hover from heatmap → map
  useEffect(() => {
    if (!ready) return
    layersRef.current.forEach((layer, code) => {
      if (code === hoveredState) {
        ;(layer as L.Path).setStyle({ weight: 2.5, color: '#ffffff' })
        // bring to front if possible
        if ('bringToFront' in layer) (layer as L.Path).bringToFront()
      } else {
        const score = scores.get(code)
        const severity = score?.severity ?? 'normal'
        ;(layer as L.Path).setStyle({
          weight: 1,
          color: severityColor(severity) + '80',
        })
      }
    })
  }, [hoveredState, scores, ready])

  return (
    <div className="relative w-full h-full min-h-[320px]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-umbral-black/80">
          <div className="animate-spin w-6 h-6 border-2 border-signal-teal border-t-transparent rounded-full" />
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full min-h-[280px] rounded" />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-2 px-2 py-1 rounded bg-umbral-black/80 border border-umbral-ash/50">
        {(['normal', 'degraded', 'high', 'critical'] as OutageSeverity[]).map((sev) => (
          <div key={sev} className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-sm"
              style={{ backgroundColor: severityColor(sev) }}
            />
            <span className="text-[8px] font-mono text-umbral-muted">
              {SEVERITY_LABELS[sev][locale as 'en' | 'es']}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
