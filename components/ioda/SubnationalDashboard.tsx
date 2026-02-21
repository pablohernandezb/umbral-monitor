'use client'

import { useState, useMemo, useCallback } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { useIoda } from '@/hooks/useIoda'
import { getRegionSignals, getRegionOutageScores } from '@/lib/ioda'
import { StateHeatmap } from './StateHeatmap'
import { VenezuelaMap } from './VenezuelaMap'
import { OutageScoreList } from './OutageScoreList'
import type { RegionsBatchResponse, OutageScoresBatchResponse, StateOutageScore } from '@/types/ioda'

type DatasourceTab = 'bgp' | 'ping-slash24' | 'merit-nt'

const TABS: { key: DatasourceTab; labelKey: string }[] = [
  { key: 'bgp', labelKey: 'ioda.subnational.tabBgp' },
  { key: 'ping-slash24', labelKey: 'ioda.subnational.tabProbing' },
  { key: 'merit-nt', labelKey: 'ioda.subnational.tabTelescope' },
]

export function SubnationalDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<DatasourceTab>('bgp')
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  // Track which datasources have been activated (for lazy loading)
  const [activatedTabs, setActivatedTabs] = useState<Set<DatasourceTab>>(new Set(['bgp']))

  const handleTabSwitch = useCallback((tab: DatasourceTab) => {
    setActiveTab(tab)
    setActivatedTabs((prev) => {
      if (prev.has(tab)) return prev
      const next = new Set(prev)
      next.add(tab)
      return next
    })
  }, [])

  // Fetch BGP data (loads on mount)
  const bgpResult = useIoda<RegionsBatchResponse>({
    fetcher: () => getRegionSignals('bgp', 24),
    deps: [],
    autoRefresh: false,
  })

  // Fetch Probing data (lazy)
  const probingResult = useIoda<RegionsBatchResponse>({
    fetcher: () =>
      activatedTabs.has('ping-slash24')
        ? getRegionSignals('ping-slash24', 24)
        : Promise.resolve({ datasource: 'ping-slash24', regions: [], fetchedAt: new Date().toISOString(), error: null }),
    deps: [activatedTabs.has('ping-slash24')],
    autoRefresh: false,
  })

  // Fetch Telescope data (lazy)
  const telescopeResult = useIoda<RegionsBatchResponse>({
    fetcher: () =>
      activatedTabs.has('merit-nt')
        ? getRegionSignals('merit-nt', 24)
        : Promise.resolve({ datasource: 'merit-nt', regions: [], fetchedAt: new Date().toISOString(), error: null }),
    deps: [activatedTabs.has('merit-nt')],
    autoRefresh: false,
  })

  // Fetch real IODA outage scores (loads on mount)
  const outageResult = useIoda<OutageScoresBatchResponse>({
    fetcher: () => getRegionOutageScores(),
    deps: [],
    autoRefresh: false,
  })

  // Select the active datasource result
  const activeResult =
    activeTab === 'bgp' ? bgpResult
      : activeTab === 'ping-slash24' ? probingResult
        : telescopeResult

  const regions = activeResult.data?.regions ?? []
  const loading = activeResult.loading
  const error = activeResult.error

  // Build scores Map from real IODA outage data
  const outageScores = useMemo(() => {
    const scores = new Map<string, StateOutageScore>()
    const list = outageResult.data?.scores ?? []
    for (const s of list) {
      scores.set(s.regionCode, s)
    }
    return scores
  }, [outageResult.data])

  // Sorted list for the score panel (already sorted by API, but ensure it)
  const scoresList = useMemo(() => {
    return [...(outageResult.data?.scores ?? [])].sort((a, b) => b.score - a.score)
  }, [outageResult.data])

  const lastUpdated = activeResult.lastUpdated

  return (
    <div className="rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-signal-teal" />
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              {t('ioda.subnational.title')}
            </h3>
            <p className="text-[10px] text-umbral-muted mt-0.5">
              {t('ioda.subnational.subtitle')}
            </p>
          </div>
        </div>

        <a
          href="https://ioda.inetintel.cc.gatech.edu/country/VE?tab=regional"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-signal-teal hover:underline shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          IODA
        </a>
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Datasource tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-umbral-muted mr-1 uppercase tracking-wider">
            {t('ioda.subnational.datasource')}:
          </span>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabSwitch(tab.key)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-mono border transition-colors',
                activeTab === tab.key
                  ? 'border-signal-teal/50 bg-signal-teal/10 text-signal-teal'
                  : 'border-umbral-ash text-umbral-muted hover:border-umbral-steel hover:text-umbral-light'
              )}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-md border border-signal-red/30 bg-signal-red/5 px-4 py-3 text-xs font-mono text-signal-red">
            {error}
          </div>
        )}

        {/* Main grid: heatmap (2/3) + map + score list (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Heatmap */}
          <div className="lg:col-span-2 bg-umbral-charcoal border border-umbral-ash rounded-lg p-3 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-signal-teal shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-umbral-muted">
                {t('ioda.subnational.heatmapLabel')}
              </span>
            </div>
            <StateHeatmap
              regions={regions}
              hoveredState={hoveredState}
              onHoverState={setHoveredState}
              loading={loading}
            />
          </div>

          {/* Map + Outage Score List stacked */}
          <div className="flex flex-col gap-4">
            {/* Map */}
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

            {/* Outage Score List */}
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

        {/* Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-umbral-muted pt-2 border-t border-umbral-ash/30">
          <span>{t('ioda.monitor.source')}</span>
          <span>
            {lastUpdated
              ? `${t('common.lastUpdated')}: ${lastUpdated.toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}`
              : t('ioda.monitor.notYetUpdated')}
          </span>
        </div>
      </div>
    </div>
  )
}
