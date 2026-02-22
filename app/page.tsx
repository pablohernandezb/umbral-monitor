'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Play,
  Activity,
  Radio,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wifi,
  Minus,
  ExternalLink,
  BarChart3,
  Clock,
  Info,
  Shield,
  User,
  UserCheck,
  Baby,
  Mars,
  Venus,
  MoveDown,
  MoveUp,
  CircleQuestionMark,
  SquareActivity,
  ChartArea,
  MessageCircleWarning,
  Landmark,
  Undo,
  Vote,
  RotateCcw,
  HandFist,
  GitBranch,
  TrendingUpDown,
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/i18n'
import { ScenarioCard } from '@/components/ui/ScenarioCard'
import { ScenarioTimeline } from '@/components/ui/ScenarioTimeline'
import { ScenarioTrajectoryPanel } from '@/components/ui/ScenarioTrajectoryPanel'
import { NewsCard } from '@/components/ui/NewsCard'
import { MetricCard } from '@/components/ui/MetricCard'
import { FAQAccordion } from '@/components/ui/FAQAccordion'
import { TickerSimple } from '@/components/ui/Ticker'
import { FactCheckingFeed } from '@/components/ui/FactCheckingFeed'
import { GdeltDashboard } from '@/components/ui/GdeltDashboard'
import { PolymarketDashboard } from '@/components/ui/PolymarketDashboard'
import { IodaDashboard } from '@/components/ioda/IodaDashboard'
import { TrajectoryChart } from '@/components/charts/TrajectoryChart'
import { getScenarioTimeline } from '@/data/scenario-phases'
import {
  getScenarios,
  getRegimeHistory,
  getNewsFeed,
  getLatestPrisonerStats,
  getPrisonersByOrganization,
  getHistoricalEpisodes,
  getSubmissionAverages,
} from '@/lib/data'
import type { SubmissionAverages } from '@/lib/data'
import { voteForScenario } from '@/app/actions/news-votes'
import { daysSince, cn } from '@/lib/utils'
import type { 
  Scenario, 
  RegimeHistory, 
  NewsItem, 
  PoliticalPrisoner,
  PrisonerByOrganization,
  HistoricalEpisode
} from '@/types'

// Map scenario key to the number used in scenario_probabilities JSONB
const scenarioKeyToNumber: Record<string, number> = {
  regressedAutocracy: 1,
  revertedLiberalization: 2,
  stabilizedElectoralAutocracy: 3,
  preemptedDemocraticTransition: 4,
  democraticTransition: 5,
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

export default function LandingPage() {
  const { t, locale } = useTranslation()
  
  // State for all data
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [regimeHistory, setRegimeHistory] = useState<RegimeHistory[]>([])
  const [historicalEpisodes, setHistoricalEpisodes] = useState<HistoricalEpisode[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [prisonerStats, setPrisonerStats] = useState<PoliticalPrisoner | null>(null)
  const [prisonersByOrg, setPrisonersByOrg] = useState<PrisonerByOrganization[]>([])
  const [submissionAvgs, setSubmissionAvgs] = useState<SubmissionAverages | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)
  const [showTrajectoryPanel, setShowTrajectoryPanel] = useState(false)

  // Refs for scrolling
  const scenarioCardsRef = useRef<HTMLDivElement>(null)
  const scenarioTimelineRef = useRef<HTMLDivElement>(null)
  const trajectoryPanelRef = useRef<HTMLDivElement>(null)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [
          scenariosRes,
          historyRes,
          episodesRes,
          newsRes,
          prisonersRes,
          prisonersByOrgRes,
          submissionAvgsRes,
        ] = await Promise.allSettled([
          getScenarios(),
          getRegimeHistory(),
          getHistoricalEpisodes(),
          getNewsFeed(500),
          getLatestPrisonerStats(),
          getPrisonersByOrganization(),
          getSubmissionAverages(),
        ])

        if (scenariosRes.status === 'fulfilled' && scenariosRes.value.data) {
          // Sort by scenario number (1-5, left to right)
          const sorted = [...scenariosRes.value.data].sort(
            (a, b) => (scenarioKeyToNumber[a.key] || 0) - (scenarioKeyToNumber[b.key] || 0)
          )
          setScenarios(sorted)
        }
        if (historyRes.status === 'fulfilled' && historyRes.value.data) setRegimeHistory(historyRes.value.data)
        if (episodesRes.status === 'fulfilled' && episodesRes.value.data) setHistoricalEpisodes(episodesRes.value.data)
        if (newsRes.status === 'fulfilled' && newsRes.value.data) {
          // Keep only the latest article per source
          const latestBySource = new Map<string, NewsItem>()
          for (const item of newsRes.value.data) {
            if (!latestBySource.has(item.source)) {
              latestBySource.set(item.source, item)
            }
          }
          setNews(Array.from(latestBySource.values()))
        }
        if (prisonersRes.status === 'fulfilled' && prisonersRes.value.data) setPrisonerStats(prisonersRes.value.data)
        if (prisonersByOrgRes.status === 'fulfilled' && prisonersByOrgRes.value.data) setPrisonersByOrg(prisonersByOrgRes.value.data)
        if (submissionAvgsRes.status === 'fulfilled' && submissionAvgsRes.value.data) setSubmissionAvgs(submissionAvgsRes.value.data)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Scroll to trajectory panel when opened
  useEffect(() => {
    if (showTrajectoryPanel && trajectoryPanelRef.current) {
      setTimeout(() => {
        const element = trajectoryPanelRef.current
        if (element) {
          const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 100
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
        }
      }, 100)
    }
  }, [showTrajectoryPanel])

  // Scroll to timeline when scenario is selected, scroll to cards when closed
  useEffect(() => {
    if (activeScenarioId && scenarioTimelineRef.current) {
      // Scroll to timeline when a scenario is selected
      setTimeout(() => {
        const element = scenarioTimelineRef.current
        if (element) {
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - 100 // 100px offset for header

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 100) // Small delay to let the timeline render
    }
  }, [activeScenarioId])

  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.slice(1) // removes the '#'
      const element = document.getElementById(id)
      if (element) {
        const offset = element.getBoundingClientRect().top + window.pageYOffset - 100
        window.scrollTo({ top: offset, behavior: 'smooth' })
      }
    }
  }, [loading]) // fires when loading flips from true to false

  // FAQ items from translations
  const faqItems = [
    { question: t('landing.faq.items.0.question'), answer: t('landing.faq.items.0.answer') },
    { question: t('landing.faq.items.1.question'), answer: t('landing.faq.items.1.answer') },
    { question: t('landing.faq.items.2.question'), answer: t('landing.faq.items.2.answer') },
    { question: t('landing.faq.items.3.question'), answer: t('landing.faq.items.3.answer') },
    { question: t('landing.faq.items.4.question'), answer: t('landing.faq.items.4.answer') },
    { question: t('landing.faq.items.5.question'), answer: t('landing.faq.items.5.answer') },
  ]

  // Calculate days since Maduro's and Cilia's extraction
  const daysSinceCapture = daysSince('2026-01-03')

  // Handle voting on news scenarios
  const handleNewsVote = async (newsId: string, scenarioNumber: number) => {
    // Optimistic update
    setNews(prevNews => 
      prevNews.map(item => {
        if (item.id !== newsId) return item
        const key = `votes_scenario_${scenarioNumber}` as keyof NewsItem
        return {
          ...item,
          [key]: (item[key] as number) + 1
        }
      })
    )

    // Call server action
    const result = await voteForScenario(newsId, scenarioNumber)
    
    if (!result.success) {
      // Revert on error
      setNews(prevNews => 
        prevNews.map(item => {
          if (item.id !== newsId) return item
          const key = `votes_scenario_${scenarioNumber}` as keyof NewsItem
          return {
            ...item,
            [key]: (item[key] as number) - 1
          }
        })
      )
      console.error('Vote failed:', result.error)
    }
  }

  return (
    <div className="relative">
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-signal-teal/5 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Live badge */}
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-umbral-ash/30 border border-signal-teal/30 text-signal-teal text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-teal opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-teal" />
                </span>
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight"
            >
              <span className="text-white">{t('landing.hero.title')}</span>
              <br />
              <span className="text-gradient">{t('landing.hero.titleHighlight')}</span>
              <span className="text-signal-teal">.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-umbral-muted max-w-2xl mx-auto leading-relaxed"
            >
              {t('landing.hero.subtitle')}
            </motion.p>

            {/* CTA buttons */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/participate"
                className="btn btn-primary text-base px-8 py-3 group"
              >
                {t('common.participate')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/how-did-we-get-here"
                className="btn btn-secondary text-base px-8 py-3 group"
              >
                {t('common.howDidWeGetHere')}
              </Link>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-umbral-steel rounded-full p-1">
              <div className="w-1.5 h-2 bg-signal-teal rounded-full animate-bounce mx-auto" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          SCENARIOS SECTION
          ============================================================ */}
      <section id="scenarios" className="section relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-4 flex items-center justify-center gap-3">
              <SquareActivity className="w-7 h-7 text-signal-teal" />
              {t('landing.scenarios.title')}
            </h2>
            <p className="section-subtitle mx-auto">
              {t('landing.scenarios.subtitle')}
            </p>
          </motion.div>
          {/* Section header - moved inside the terminal */}
          <motion.div
            key={loading ? 'loading' : 'loaded'}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="relative"
          >


            <div ref={scenarioCardsRef} className="bg-umbral-charcoal/80 border border-umbral-ash rounded-xl overflow-hidden relative">
              {/* Faux code background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <pre className="text-[10px] leading-tight font-mono text-signal-teal p-4 whitespace-pre select-none">
{`1  function processUserData(user) {
2    const data = JSON.parse(user.input);
3    return database.query(\`
4      SELECT * FROM users WHERE id=\${data.id}
5    \`);
6  }
7
8  async function analyzeRegime(country) {
9    const indices = await fetchIndices(country);
10   const episodes = await getDEEDEvents(country);
11   
12   return {
13     liberalDemocracy: indices.v_dem_libdem,
14     electoralDemocracy: indices.v_dem_polyarchy,
15     episodes: episodes.filter(e => e.year >= 1998)
16   };
17 }
18
19 const transformScenarios = [
20   { key: 'democratic_transition', probability: 0.15 },
21   { key: 'reverted_liberalization', probability: 0.35 },
22   { key: 'prevented_transition', probability: 0.65 },
23   { key: 'regressive_autocracy', probability: 0.25 },
24   { key: 'stabilized_autocracy', probability: 0.75 }
25 ];
26
27 export async function monitorSignals() {
28   const news = await aggregateFeeds(sources);
29   const prisoners = await fetchPrisonerStats();
30   return evaluateScenarios(news, prisoners);
31 }`}
                </pre>
              </div>

              {/* Terminal header */}
              <div className="relative z-10 flex items-center justify-start gap-4 px-6 py-4 border-b border-umbral-ash bg-umbral-black/50">
                {/* Terminal window decoration */}
                <div className="relative -top-1 left-1 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-signal-red" />
                  <div className="w-3 h-3 rounded-full bg-signal-amber" />
                  <div className="w-3 h-3 rounded-full bg-signal-teal" />
                </div>
                <p className="text-xs text-umbral-muted uppercase tracking-wider font-mono">
                  {locale === 'es' 
                    ? 'HAZ CLICK EN UN ESCENARIO PARA VER SU LÍNEA DE TIEMPO DE EVENTOS'
                    : 'CLICK ON A SCENARIO TO SEE ITS TIMELINE OF EVENTS'
                  }
                </p>
              </div>

              {/* Scenario cards grid */}
              <div className="relative z-10 p-6 lg:p-8">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="card p-5 animate-pulse bg-umbral-black/60 backdrop-blur-sm">
                        <div className="w-10 h-10 rounded-lg bg-umbral-ash mb-4" />
                        <div className="h-4 bg-umbral-ash rounded w-3/4 mb-2" />
                        <div className="h-3 bg-umbral-ash rounded w-full mb-4" />
                        <div className="h-1.5 bg-umbral-ash rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {scenarios.map((scenario, index) => {
                      const sNum = scenarioKeyToNumber[scenario.key] || 0
                      return (
                        <motion.div key={scenario.id} variants={fadeInUp} className="h-full">
                          <ScenarioCard
                            scenario={scenario}
                            className="bg-umbral-black/60 backdrop-blur-sm h-full"
                            onClick={() => setActiveScenarioId(activeScenarioId === scenario.id ? null : scenario.id)}
                            isActive={activeScenarioId === scenario.id}
                            expertRating={submissionAvgs?.expert[sNum]}
                            publicRating={submissionAvgs?.public[sNum]}
                          />
                        </motion.div>
                      )
                    })}
                  </div>
                )}

                  {/* Trajectory panel toggle */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowTrajectoryPanel(v => !v)}
                      className={cn(
                        'flex items-center gap-2 text-xs font-mono transition-colors px-3 py-1.5 rounded-md border mt-5',
                        showTrajectoryPanel
                          ? 'text-signal-blue border-signal-blue/40 bg-signal-blue/10 hover:bg-signal-blue/15'
                          : 'text-umbral-muted border-umbral-ash hover:text-signal-blue hover:border-signal-blue/30 hover:bg-signal-blue/5'
                      )}
                    >
                      <TrendingUpDown className="w-3.5 h-3.5" />
                      {showTrajectoryPanel
                        ? t('scenarios.trajectoryPanel.buttonClose')
                        : t('scenarios.trajectoryPanel.button')
                      }
                    </button>
                  </div>

                {/* Footer stats */}
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-umbral-ash">
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-dot-stable" />
                    <span className="text-base text-umbral-muted">
                      {t('landing.scenarios.analyzing')}
                    </span>
                  </div>
                  <div className="text-base text-umbral-muted">
                    {locale === 'es'
                      ? <>basado en <span className="text-white">{submissionAvgs?.expertCount ?? 0}</span> análisis de expertos y <span className="text-white">{submissionAvgs?.publicCount ?? 0}</span> evaluaciones ciudadanas</>
                      : <>based on <span className="text-white">{submissionAvgs?.expertCount ?? 0}</span> expert analysis and <span className="text-white">{submissionAvgs?.publicCount ?? 0}</span> citizens evaluations</>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Trajectory Panel */}
            {showTrajectoryPanel && (
              <div ref={trajectoryPanelRef} className="mt-4">
                <ScenarioTrajectoryPanel
                  onClose={() => {
                    setShowTrajectoryPanel(false)
                    scenarioCardsRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                />
              </div>
            )}

            {/* Deployable Timeline Panel */}
            {activeScenarioId && (() => {
              const activeScenario = scenarios.find(s => s.id === activeScenarioId)
              const timelineData = activeScenario ? getScenarioTimeline(activeScenario.key) : null

              return activeScenario && timelineData ? (
                <div className="mt-4">
                  <ScenarioTimeline
                    ref={scenarioTimelineRef}
                    scenario={activeScenario}
                    phases={timelineData.phases}
                    onClose={() => {
                      scenarioCardsRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      })
                      setTimeout(() => setActiveScenarioId(null), 500)
                    }}
                  />
                </div>
              ) : null
            })()}
          </motion.div>

          {/* Days since capture ticker */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mt-12"
          >
            <TickerSimple 
              days={daysSinceCapture}
            />
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          REGIME TRAJECTORY SECTION
          ============================================================ */}
      <section id="trajectory" className="section bg-umbral-charcoal/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-4 inline-flex items-start gap-3 mx-auto">
              <ChartArea className="w-7 h-7 mt-1 ml-2 text-signal-blue flex-shrink-0" />
              {t('landing.trajectory.title')}
            </h2>
            <p className="section-subtitle mx-auto">
              {locale === 'es' ? (
                <>
                  Momentos en la historia venezolana donde han ocurrido episodios de{' '}
                  <span className="text-signal-blue font-semibold">democratización</span> o{' '}
                  <span className="text-signal-red font-semibold">autocratización</span>
                </>
              ) : (
                <>
                  Moments in Venezuelan history where episodes of{' '}
                  <span className="text-signal-blue font-semibold">democratization</span> or{' '}
                  <span className="text-signal-red font-semibold">autocratization</span> have occurred
                </>
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="card p-4 md:p-6">
              {loading ? (
                <div className="h-[200px] md:h-[400px] flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-2 border-signal-teal border-t-transparent rounded-full" />
                </div>
              ) : (
                <>
                  <div className="block md:hidden">
                    <TrajectoryChart
                      data={regimeHistory}
                      episodes={historicalEpisodes}
                      height={200}
                      showEpisodes={true}
                    />
                  </div>
                  <div className="hidden md:block">
                    <TrajectoryChart
                      data={regimeHistory}
                      episodes={historicalEpisodes}
                      height={400}
                      showEpisodes={true}
                    />
                  </div>
                </>
              )}
              
              {/* Data source */}
              <div className="mt-4 pt-4 border-t border-umbral-ash flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-umbral-muted">
                  {t('landing.trajectory.dataSource')}
                </p>
                <Link 
                  href="/how-did-we-get-here" 
                  className="text-xs text-signal-teal hover:underline flex items-center gap-1"
                >
                  {locale === 'es' ? 'Explorar más: ¿cómo llegamos aquí?' : 'Explore more: How did we get here?'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Historical episodes */}
          <motion.div
            key={loading ? 'loading' : 'loaded'}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
          >
            {historicalEpisodes.map((episode) => (
              <motion.div key={episode.id} variants={fadeInUp} className="h-full">
                <div className={cn(
                  'card p-4 border-l-2 h-full flex gap-3',
                  episode.episode_type === 'democracy' && 'border-l-signal-blue',
                  episode.episode_type === 'autocracy' && 'border-l-signal-red',
                  episode.episode_type === 'transition' && 'border-l-signal-amber'
                )}>
                  {/* Icon container */}
                  {episode.episode_type === 'autocracy' && (
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-signal-red/30 bg-signal-red/10">
                      <TrendingDown className="w-5 h-5 text-signal-red" />
                    </div>
                  )}
                  {episode.episode_type === 'democracy' && (
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-signal-blue/30 bg-signal-blue/10">
                      <TrendingUp className="w-5 h-5 text-signal-blue" />
                    </div>
                  )}
                  {episode.episode_type === 'transition' && (
                    <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-signal-amber/30 bg-signal-amber/10">
                      <Minus className="w-5 h-5 text-signal-amber" />
                    </div>
                  )}

                  {/* Content */}
                    <div className="flex-1 flex flex-col">
                    {episode.episode_type === 'autocracy' && (
                      <p className="text-2xl text-signal-red mb-2 font-mono">
                        {t(`historicalEpisodes.${episode.key}.period`)}
                      </p>
                    )}
                    {episode.episode_type === 'democracy' && (
                      <p className="text-2xl text-signal-blue mb-2 font-mono">
                        {t(`historicalEpisodes.${episode.key}.period`)}
                      </p>
                    )}
                    {episode.episode_type === 'transition' && (
                      <p className="text-2xl text-signal-amber mb-2 font-mono">
                        {t(`historicalEpisodes.${episode.key}.period`)}
                      </p>
                    )}
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {t(`historicalEpisodes.${episode.key}.name`)}
                    </h4>
                    <p className="text-sm text-umbral-muted leading-relaxed">
                      {t(`historicalEpisodes.${episode.key}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          NEWS FEED SECTION
          ============================================================ */}
      <section id="news" className="section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-2 flex items-center justify-center gap-3">
              <Radio className="w-6 h-6 text-signal-amber" />
              {t('landing.news.title')}
            </h2>
            <p className="section-subtitle mx-auto">
              {t('landing.news.subtitle')}
            </p>

            {/* Scenario voting instruction + legend */}
            <div className="mt-5 flex flex-col items-center gap-3">
              <p className="text-xs text-umbral-muted max-w-xl">
                {locale === 'es'
                  ? 'En cada noticia puedes indicar qué escenario favorece presionando el botón correspondiente:'
                  : 'On each news card you can indicate which scenario it supports by pressing the corresponding button:'
                }
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {([
                  { key: 'regressedAutocracy', Icon: HandFist },
                  { key: 'revertedLiberalization', Icon: RotateCcw },
                  { key: 'stabilizedElectoralAutocracy', Icon: Vote },
                  { key: 'preemptedDemocraticTransition', Icon: Undo },
                  { key: 'democraticTransition', Icon: Landmark },
                ] as const).map(({ key, Icon }) => (
                  <span
                    key={key}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border bg-signal-blue/10 border-signal-blue/20 text-xs"
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-signal-blue" />
                    <span className="text-umbral-light">{t(`scenarios.${key}.name`)}</span>
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            key={loading ? 'loading' : 'loaded'}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-20 bg-umbral-ash rounded" />
                    <div className="h-5 w-16 bg-umbral-ash rounded" />
                  </div>
                  <div className="h-5 bg-umbral-ash rounded w-3/4 mb-2" />
                  <div className="h-4 bg-umbral-ash rounded w-full mb-3" />
                  <div className="h-3 bg-umbral-ash rounded w-1/3" />
                </div>
              ))
            ) : (
              news.map((item) => (
                <motion.div key={item.id} variants={fadeInUp}>
                  <NewsCard item={item} onVote={handleNewsVote} />
                </motion.div>
              ))
            )}
          </motion.div>

          {/* View All button - centered at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mt-8"
          >
            <Link 
              href="/news"
              className="btn btn-secondary px-6 py-2.5 text-sm group"
            >
              {t('common.viewAll')}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* GDELT Signal Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <GdeltDashboard />
          </motion.div>

          {/* Fact-Checking Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <FactCheckingFeed />
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          POLITICAL PRISONERS SECTION
          ============================================================ */}
      <section id="prisoners" className="section bg-umbral-charcoal/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-2 flex items-center justify-center gap-3">
              <Users className="w-6 h-6 text-signal-red" />
              {t('landing.prisoners.title')}
            </h2>
            <p className="section-subtitle mx-auto">
              {t('landing.prisoners.subtitle')}
            </p>
          </motion.div>

          <motion.div
            key={loading ? 'loading' : 'loaded'}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {/* Main metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
              <motion.div variants={fadeInUp}>
                <MetricCard
                  label={t('landing.prisoners.total')}
                  value={prisonerStats?.total_count || 711}
                  trend={{ value: 67, direction: 'down', label: t('landing.prisoners.excarcelation_date') }}
                  size="large"
                />
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <MetricCard
                  label={t('landing.prisoners.releasesJ8')}
                  value={prisonerStats?.releases_30d || 45}
                  size="large"
                />
              </motion.div>
            </div>

            {/* Breakdown metrics */}            
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <motion.div variants={fadeInUp}>
                <MetricCard 
                  label={t('landing.prisoners.civilians')}
                  value={prisonerStats?.civilians || 68}
                  icon={<Users className="w-10 h-10" />}
                />
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <MetricCard 
                  label={t('landing.prisoners.military')}
                  value={prisonerStats?.military || 1203}
                  icon={<Shield className="w-10 h-10" />}
                />
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <MetricCard 
                  label={t('landing.prisoners.men')}
                  value={prisonerStats?.men || 0}
                  icon={<Mars className="w-10 h-10" />}
                />
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <MetricCard 
                  label={t('landing.prisoners.women')}
                  value={prisonerStats?.women || 0}
                  icon={<Venus className="w-10 h-10" />}
                />
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <MetricCard 
                  label={t('landing.prisoners.adults')}
                  value={prisonerStats?.adults || 0}
                  icon={<UserCheck className="w-10 h-10" />}
                />
              </motion.div>
              
              <motion.div variants={fadeInUp}>
                <MetricCard 
                  label={t('landing.prisoners.minors')}
                  value={prisonerStats?.minors || 0}
                  icon={<Baby className="w-10 h-10" />}
                />
              </motion.div>
            </div>

              {/* Footer of Political Prisoners */}
              <motion.div variants={fadeInUp} className="card p-2 mb-5">              
                <p className="text-xs text-umbral-muted flex items-center gap-2">
                  <Info className="w-3 h-3" />
                  {t('landing.prisoners.foreign_text')}: {prisonerStats?.foreign || 0}. {t('landing.prisoners.unknown_text')}: {prisonerStats?.unknown || 0}.
                </p>
              </motion.div>

            {/* By organization */}
            <motion.div variants={fadeInUp} className="card p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-umbral-muted" />
                {t('landing.prisoners.byOrganization')}
              </h3>
              
              <div className="space-y-3">
                {prisonersByOrg.map((org, index) => {
                  const maxCount = Math.max(...prisonersByOrg.map(o => o.count))
                  const percentage = (org.count / maxCount) * 100
                  
                  return (
                    <div key={org.id} className="flex items-center gap-3">
                      <span className="text-sm text-umbral-muted w-60 truncate">
                        {org.organization}
                      </span>
                      <div className="flex-1 h-2 bg-umbral-ash rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-signal-red rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-white w-16 text-right">
                        {org.count.toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-umbral-ash flex items-center justify-between">
                <p className="text-xs text-umbral-muted flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {t('common.lastUpdated')}: {prisonerStats?.date || '2024-01-15'}
                </p>
                <p className="text-xs text-umbral-muted">
                  {t('common.sources')}: {prisonerStats?.source || 'Foro Penal, CLIPPVE'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          INTERNET CONNECTIVITY SECTION
          ============================================================ */}
      <section id="connectivity" className="section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-4 flex items-center justify-center gap-3">
              <Wifi className="w-7 h-7 text-signal-teal" />
              {t('ioda.sectionTitle')}
            </h2>
            <p className="section-subtitle mx-auto">
              {t('ioda.sectionSubtitle')}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <IodaDashboard />
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          MARKETS SECTION
          ============================================================ */}
      <section id="markets" className="section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="w-7 h-7 text-signal-teal" />
              {t('predictionMarkets.title')}
            </h2>
            <p className="section-subtitle mx-auto">
              {t('predictionMarkets.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <PolymarketDashboard />
          </motion.div>
        </div>
      </section>

      {/* ============================================================
          FAQ SECTION
          ============================================================ */}
      <section id="faq" className="section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-8"
          >
            <h2 className="section-title mb-4 inline-flex items-start gap-3 mx-auto">
              <CircleQuestionMark className="w-6 h-6 mt-1 ml-2 text-signal-amber flex-shrink-0" />
              {t('landing.faq.title')}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <FAQAccordion items={faqItems} />
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-t from-umbral-charcoal to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-8 md:p-12 border-signal-teal/30"
          >
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              <MessageCircleWarning className="w-7 h-7 text-signal-teal inline-block mr-2 mb-2" />
              {locale === 'es' 
                ? 'Haz oír tu voz' 
                : 'Make your voice heard'
              }
            </h3>
            <p className="text-umbral-muted mb-6 max-w-xl mx-auto">
              {locale === 'es'
                ? 'Súmate a Umbral y ayuda al monitoreo dando tu opinión.'
                : 'Join Umbral and support monitoring by sharing your insights.'
              }
            </p>
            <Link href="/participate" className="btn btn-primary px-8 py-3 text-base">
              {locale === 'es'
                ? 'Participa'
                : 'Participate'
              }
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
