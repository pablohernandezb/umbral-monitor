'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ListChecks, Layers, CheckCircle2, Loader2, ChevronDown } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { MetricCard } from '@/components/ui/MetricCard'
import { DominoPhaseBar } from '@/components/installing-democracy/DominoPhaseBar'
import { MilestoneCountdownRow } from '@/components/installing-democracy/MilestoneCountdownRow'
import { PhaseProgressPanel } from '@/components/installing-democracy/PhaseProgressPanel'
import { PillarProgressPanel } from '@/components/installing-democracy/PillarProgressPanel'
import { ChecklistActionCard } from '@/components/installing-democracy/ChecklistActionCard'
import { ChecklistFilters, type ChecklistFilterState } from '@/components/installing-democracy/ChecklistFilters'
import { ReferencesPanel } from '@/components/installing-democracy/ReferencesPanel'
import { MethodologyNotice } from '@/components/installing-democracy/MethodologyNotice'
import {
  getTransitionChecklist,
  subscribeToTransitionChecklist,
  getEvaluationAggregates,
  getTotalEvaluatorCount,
} from '@/lib/data'
import { computeProgress } from '@/lib/transition'
import { phaseForMonth } from '@/data/transition-phases'
import type { TransitionAction, EvaluationAggregate } from '@/types'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const DEFAULT_FILTERS: ChecklistFilterState = {
  pillar: 'all',
  phase: 'all',
  status: 'all',
  search: '',
}

/** Cards rendered initially, and added per "load more" click. */
const PAGE_SIZE = 10

export default function InstallingDemocracyPage() {
  const { t, locale } = useTranslation()
  const [actions, setActions] = useState<TransitionAction[]>([])
  const [aggregates, setAggregates] = useState<EvaluationAggregate[]>([])
  const [totalEvaluators, setTotalEvaluators] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ChecklistFilterState>(DEFAULT_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    let cancelled = false

    async function loadAggregates() {
      const [aggRes, evalRes] = await Promise.all([getEvaluationAggregates(), getTotalEvaluatorCount()])
      if (cancelled) return
      if (aggRes.data) setAggregates(aggRes.data)
      if (evalRes.data !== null) setTotalEvaluators(evalRes.data)
    }

    async function load() {
      const res = await getTransitionChecklist()
      if (!cancelled && res.data) setActions(res.data)
      await loadAggregates()
      if (!cancelled) setLoading(false)
    }
    load()

    const unsubscribe = subscribeToTransitionChecklist(() => {
      // A change touches one row; re-fetch the whole list so the rollup and
      // filtered results both stay consistent with the DB.
      getTransitionChecklist().then(res => {
        if (!cancelled && res.data) setActions(res.data)
      })
    })

    // Evaluations have no anon-readable raw table, so there's no realtime
    // channel to subscribe to (RLS blocks postgres_changes the same as a
    // direct select) — poll the aggregate views instead so scores update
    // live-ish while the page is open.
    const pollId = setInterval(loadAggregates, 60_000)

    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(pollId)
    }
  }, [])

  const progress = useMemo(
    () => computeProgress(actions, aggregates, totalEvaluators),
    [actions, aggregates, totalEvaluators]
  )

  const aggregateById = useMemo(
    () => new Map(aggregates.map(a => [a.actionId, a])),
    [aggregates]
  )

  const filteredActions = useMemo(() => {
    let result = [...actions]

    if (filters.pillar !== 'all') {
      result = result.filter(a => a.pillar === filters.pillar)
    }
    if (filters.phase !== 'all') {
      result = result.filter(a => phaseForMonth(a.month) === filters.phase)
    }
    if (filters.status !== 'all') {
      result = result.filter(a => a.status === filters.status)
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase()
      result = result.filter(a => {
        const action = (locale === 'es' ? a.actionEs : a.actionEn).toLowerCase()
        const indicator = (locale === 'es' ? a.indicatorEs : a.indicatorEn).toLowerCase()
        const responsible = (locale === 'es' ? a.responsibleEs : a.responsibleEn).toLowerCase()
        return action.includes(q) || indicator.includes(q) || responsible.includes(q)
      })
    }

    return result
  }, [actions, filters, locale])

  // A new filter produces a different list, so an inherited expansion would be
  // meaningless — start each result set at the top. Deliberately keyed on
  // `filters` alone and not on `filteredActions`: a realtime row update changes
  // the list too, and collapsing the user's expansion under them because a
  // status flipped elsewhere would be hostile.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters])

  const visibleActions = filteredActions.slice(0, visibleCount)
  const remaining = filteredActions.length - visibleActions.length

  return (
    <div className="relative min-h-screen">
      {/* Hero */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-signal-teal/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
              {t('installingDemocracy.title')}
            </h1>
            <p className="text-base md:text-lg text-umbral-muted leading-relaxed">
              {t('installingDemocracy.summary')}
            </p>
            {!loading && (
              <p className="text-6xl md:text-7xl font-bold text-white font-display pt-4">
                {progress.completionPct}%
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-signal-teal animate-spin" />
        </div>
      ) : (
        <>
          {/* Domino bar */}
          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="card p-5 md:p-8">
                <DominoPhaseBar progress={progress} showPercent={false} />
              </div>
            </div>
          </section>

          {/* Methodology notice */}
          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <MethodologyNotice />
            </div>
          </section>

          {/* Countdowns */}
          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <MilestoneCountdownRow variant="full" />
            </div>
          </section>

          {/* Stat row */}
          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label={t('installingDemocracy.stats.totalActions')} value={progress.total} icon={<ListChecks className="w-6 h-6" />} />
              <MetricCard label={t('installingDemocracy.stats.pillars')} value={19} icon={<Layers className="w-6 h-6" />} />
              <MetricCard label={t('installingDemocracy.stats.completed')} value={progress.completed} icon={<CheckCircle2 className="w-6 h-6" />} />
              <MetricCard label={t('installingDemocracy.stats.inProgress')} value={progress.inProgress} icon={<Loader2 className="w-6 h-6" />} />
            </div>
          </section>

          {/* Phase + pillar breakdown */}
          <section className="pb-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-5 md:p-6">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
                  {t('installingDemocracy.filters.milestone')}
                </h2>
                <PhaseProgressPanel phases={progress.phases} />
              </div>
              <div className="card p-5 md:p-6">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">
                  {t('installingDemocracy.filters.pillar')}
                </h2>
                <PillarProgressPanel pillars={progress.pillars} />
              </div>
            </div>
          </section>

          {/* Filterable action list */}
          <section className="pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <ChecklistFilters value={filters} onChange={setFilters} />

              {/* Reports what is actually on screen, not just what survived the
                  filters — with paging in play those are different numbers. */}
              <p className="text-sm text-umbral-muted">
                {t('installingDemocracy.showingCount', {
                  shown: visibleActions.length,
                  total: filteredActions.length,
                })}
                {filteredActions.length !== actions.length && (
                  <span className="opacity-70">
                    {' · '}
                    {t('installingDemocracy.filteredFrom', { total: actions.length })}
                  </span>
                )}
              </p>

              {filteredActions.length === 0 ? (
                <div className="text-center py-16 text-umbral-muted">
                  {t('installingDemocracy.filters.noResults')}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleActions.map(action => (
                      <ChecklistActionCard
                        key={action.id}
                        action={action}
                        aggregate={aggregateById.get(action.id)}
                      />
                    ))}
                  </div>

                  {remaining > 0 && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-umbral-ash bg-umbral-charcoal text-sm font-mono text-umbral-light hover:border-signal-teal/50 hover:text-white transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        {t('installingDemocracy.showMore')} (+{Math.min(PAGE_SIZE, remaining)})
                      </button>
                    </div>
                  )}
                </>
              )}

              <ReferencesPanel />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
