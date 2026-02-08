'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  ChartSpline,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  Shield,
  Info,
  TrendingDown,
  ArrowRight,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { TrajectoryChart } from '@/components/charts/TrajectoryChart'
import { 
  getDemBreakdownHistory, 
  getDEEDEvents,
  getHistoricalEpisodes 
} from '@/lib/data'
import { cn } from '@/lib/utils'
import type { DemBreakdownHistory, DEEDEvent, HistoricalEpisode } from '@/types'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

// Event type icons
const eventIcons: Record<string, typeof AlertTriangle> = {
  destabilizing_event: Zap,
  precursor: AlertTriangle,
  symptom: Eye,
  resistance: Shield,
  default: Info,
}

// Event type colors
const eventColors: Record<string, string> = {
  destabilizing_event: 'bg-signal-red/10 text-signal-red border-signal-red/30',
  precursor: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  symptom: 'bg-signal-purple/10 text-signal-purple border-signal-purple/30',
  resistance: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
}

// Impact level badges
const impactBadges: Record<string, string> = {
  destabilizing_event: 'bg-signal-red/20 text-signal-red border-signal-red/30',
  precursor: 'bg-signal-amber/20 text-signal-amber border-signal-amber/30',
  symptom: 'bg-signal-purple/20 text-signal-purple border-signal-purple/30',
  resistance: 'bg-signal-blue/20 text-signal-blue border-signal-blue/30',
}

export default function HowDidWeGetHerePage() {
  const { t, locale } = useTranslation()
  
  const [demBreakdownHistory, setDemBreakdownHistory] = useState<DemBreakdownHistory[]>([])
  const [historicalEpisodes, setHistoricalEpisodes] = useState<HistoricalEpisode[]>([])
  const [allEvents, setAllEvents] = useState<DEEDEvent[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(2000)
  const [loading, setLoading] = useState(true)

  // Filter Democratic Breakdown history for 1996-2024
  const filteredHistory = useMemo(() => {
    return demBreakdownHistory.filter(d => d.year >= 1996 && d.year <= 2024)
  }, [demBreakdownHistory])

  // Get events for selected year
  const eventsForYear = useMemo(() => {
    if (!selectedYear) return []
    return allEvents.filter(e => e.year === selectedYear)
  }, [selectedYear, allEvents])

  // Get years that have events
  const yearsWithEvents = useMemo(() => {
    return [...new Set(allEvents.map(e => e.year))].sort()
  }, [allEvents])

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [historyRes, eventsRes, episodesRes] = await Promise.all([
          getDemBreakdownHistory(1996, 2024),
          getDEEDEvents(),
          getHistoricalEpisodes(),
        ])

        if (historyRes.data) setDemBreakdownHistory(historyRes.data)
        if (eventsRes.data) setAllEvents(eventsRes.data)
        if (episodesRes.data) setHistoricalEpisodes(episodesRes.data)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle year click from chart
  const handleYearClick = (year: number) => {
    setSelectedYear(year)
  }

  // Navigate between years with events
  const navigateYear = (direction: 'prev' | 'next') => {
    if (!selectedYear) {
      setSelectedYear(yearsWithEvents[0])
      return
    }

    const currentIndex = yearsWithEvents.indexOf(selectedYear)
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedYear(yearsWithEvents[currentIndex - 1])
    } else if (direction === 'next' && currentIndex < yearsWithEvents.length - 1) {
      setSelectedYear(yearsWithEvents[currentIndex + 1])
    }
  }

  // Get index value for selected year
  const selectedYearData = useMemo(() => {
    if (!selectedYear) return null
    return demBreakdownHistory.find(d => d.year === selectedYear)
  }, [selectedYear, demBreakdownHistory])

  return (
    <div className="relative min-h-screen">
      {/* Hero section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-signal-red/5 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-red/10 border border-signal-red/30 text-signal-red text-sm font-medium mb-6">
              <TrendingDown className="w-4 h-4" />
              {locale === 'es' ? 'Episodio de ruptura democrática' : 'Democratic breakdown episode'}
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              {t('howDidWeGetHere.title')}
            </h1>
            <p className="text-lg text-umbral-muted max-w-2xl mx-auto">
              {t('howDidWeGetHere.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="section pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Interactive chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="card p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ChartSpline className="w-5 h-5 text-signal-teal" />
                  {t('howDidWeGetHere.indexLabel')}
                </h2>
                {selectedYear && (
                  <span className="text-sm text-umbral-muted font-mono">
                    {locale === 'es' ? 'Año seleccionado:' : 'Selected year:'}{' '}
                    <span className="text-signal-teal font-bold">{selectedYear}</span>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-signal-teal border-t-transparent rounded-full" />
                </div>
              ) : (
                <TrajectoryChart 
                  data={filteredHistory}
                  episodes={historicalEpisodes}
                  height={400}
                  showEpisodes={false}
                  onYearClick={handleYearClick}
                />
              )}

              <p className="text-xs text-umbral-muted mt-4 text-center">
                {locale === 'es' 
                  ? 'Haga clic en cualquier punto del gráfico para ver los eventos de ese año'
                  : 'Click on any point in the chart to see events from that year'
                }
              </p>
            </div>
          </motion.div>

          {/* Year navigation and events panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Year navigation sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-4 sticky top-24">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                  {locale === 'es' ? 'Años con eventos' : 'Years with events'}
                </h3>
                
                <div className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
                  {yearsWithEvents.map((year) => {
                    const yearEvents = allEvents.filter(e => e.year === year)
                    const yearData = demBreakdownHistory.find(d => d.year === year)
                    
                    return (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={cn(
                          'w-full px-3 py-2 rounded-md flex items-center justify-between gap-2 transition-colors text-left',
                          selectedYear === year
                            ? 'bg-signal-teal/10 border border-signal-teal/30 text-signal-teal'
                            : 'hover:bg-umbral-ash text-umbral-light'
                        )}
                      >
                        <span className="font-mono font-medium">{year}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-umbral-muted">
                            {yearEvents.length} {locale === 'es' ? 'eventos' : 'events'}
                          </span>
                          {yearData && (
                            <span className="text-xs font-mono text-signal-teal">
                              {yearData.electoral_democracy_index.toFixed(3)}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Year navigation buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-umbral-ash">
                  <button
                    onClick={() => navigateYear('prev')}
                    disabled={!selectedYear || yearsWithEvents.indexOf(selectedYear) === 0}
                    className="btn btn-ghost p-2 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-umbral-muted">
                    {selectedYear || '—'}
                  </span>
                  <button
                    onClick={() => navigateYear('next')}
                    disabled={!selectedYear || yearsWithEvents.indexOf(selectedYear) === yearsWithEvents.length - 1}
                    className="btn btn-ghost p-2 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Events panel */}
            <div className="lg:col-span-2">
              <div className="card p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    {t('howDidWeGetHere.eventsTitle')}
                    {selectedYear && (
                      <span className="text-signal-teal ml-2">{selectedYear}</span>
                    )}
                  </h3>
                  
                  {selectedYearData && (
                    <div className="text-right">
                      <p className="text-xs text-umbral-muted mb-1">
                        {locale === 'es' ? 'Índice LD' : 'LD Index'}
                      </p>
                      <p className="text-2xl font-bold font-mono text-signal-teal">
                        {selectedYearData.electoral_democracy_index.toFixed(3)}
                      </p>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {!selectedYear ? (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-16"
                    >
                      <Calendar className="w-12 h-12 text-umbral-steel mx-auto mb-4" />
                      <p className="text-umbral-muted">
                        {t('howDidWeGetHere.selectYear')}
                      </p>
                    </motion.div>
                  ) : eventsForYear.length === 0 ? (
                    <motion.div
                      key="no-events"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-16"
                    >
                      <Info className="w-12 h-12 text-umbral-steel mx-auto mb-4" />
                      <p className="text-umbral-muted">
                        {t('howDidWeGetHere.noEvents')}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={selectedYear}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {eventsForYear.map((event, index) => {
                        const Icon = eventIcons[event.type] || eventIcons.default
                        const colorClass = eventColors[event.type] || 'bg-umbral-ash text-umbral-muted border-umbral-steel'
                        const impactClass = impactBadges[event.type] || impactBadges.low

                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-umbral-slate/30 rounded-lg p-5 border border-umbral-ash hover:border-umbral-steel transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              {/* Icon */}
                              <div className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0',
                                colorClass
                              )}>
                                <Icon className="w-5 h-5" />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-semibold text-white">
                                    {t(event.category)}
                                  </h4>
                                  
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded border flex-shrink-0',
                                    impactClass
                                  )}>
                                    {locale === 'es' 
                                      ? event.type === 'destabilizing_event' 
                                        ? 'Evento desestabilizador' 
                                        : event.type === 'symptom'
                                        ? 'Síntoma'
                                        : event.type === 'precursor'
                                        ? 'Precursor'
                                        : event.type === 'resistance'
                                        ? 'Resistencia'
                                        : event.type
                                      : event.type === 'destabilizing_event'
                                        ? 'Destabilizing Event'
                                        : event.type === 'symptom'
                                        ? 'Symptom'
                                        : event.type === 'precursor'
                                        ? 'Precursor'
                                        : event.type === 'resistance'
                                        ? 'Resistance'
                                        : event.type
                                    }
                                  </span>
                                </div>

                                <p className="text-sm text-umbral-muted leading-relaxed mb-3">
                                  {locale === 'es' ? event.description_es : event.description_en}
                                </p>

                                {event.actors && event.actors.length > 0 && (
                                <p className="text-sm text-umbral-muted leading-relaxed mb-3">
                                    {locale === 'es' ? 'Actores:' : 'Actors:'}<br />{t(event.actors)}
                                </p>
                                )}

                                {event.targets && event.targets.length > 0 && (
                                <p className="text-sm text-umbral-muted leading-relaxed mb-3">
                                    {locale === 'es' ? 'Objetivos:' : 'Targets:'}<br />{t(event.targets)}
                                </p>
                                )}

                                {event.month && event.month.length > 0 && (
                                <p className="text-sm text-umbral-muted leading-relaxed mb-3">
                                  {locale === 'es' ? 'Mes:' : 'Month:'}<br />{t(event.month)}
                                </p>
                                )}

                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Key insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="card p-6 md:p-8 border-signal-red/20 bg-gradient-to-r from-signal-red/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-signal-red/10 border border-signal-red/30 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-signal-red" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {locale === 'es' 
                      ? 'Un declive de 25 años' 
                      : 'A 25-year decline'
                    }
                  </h3>
                  <p className="text-umbral-muted leading-relaxed">
                    {locale === 'es'
                      ? `El Índice de Democracia Liberal de Venezuela cayó de 0.48 en 1998 a 0.04 en 2024, 
                         una reducción del 92%. Este declive gradual pero constante ilustra cómo 
                         la autocratización ocurre paso a paso, a través de eventos que individualmente 
                         pueden parecer pequeños pero acumulativamente transforman el régimen.`
                      : `Venezuela's Liberal Democracy Index fell from 0.48 in 1998 to 0.04 in 2024, 
                         a 92% reduction. This gradual but steady decline illustrates how 
                         autocratization occurs step by step, through events that individually 
                         may seem small but cumulatively transform the regime.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-t from-umbral-charcoal to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-umbral-muted mb-6">
              {locale === 'es'
                ? '¿Quieres profundizar en el análisis?'
                : 'Want to dive deeper into the analysis?'
              }
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/reading-room" className="btn btn-primary px-6 py-2.5">
                {locale === 'es' ? 'Sala de Lectura' : 'Reading Room'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/about" className="btn btn-secondary px-6 py-2.5">
                {locale === 'es' ? 'Metodología' : 'Methodology'}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
