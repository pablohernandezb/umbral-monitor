'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { getTransitionProgress, subscribeToTransitionChecklist } from '@/lib/data'
import { computeProgress } from '@/lib/transition'
import { DominoPhaseBar } from './DominoPhaseBar'
import { MilestoneCountdownRow } from './MilestoneCountdownRow'
import type { TransitionAction, TransitionProgress } from '@/types'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

// Matches the rendered content's approximate height so the skeleton doesn't
// cause layout shift once real data replaces it.
const HERO_MIN_HEIGHT = 'min-h-[560px] md:min-h-[460px]'

export function InstallingDemocracyHero() {
  const { t } = useTranslation()
  const [progress, setProgress] = useState<TransitionProgress | null>(null)
  const [actions, setActions] = useState<TransitionAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const res = await getTransitionProgress()
      if (!cancelled && res.data) {
        setProgress(res.data)
      }
      setLoading(false)
    }
    load()

    const unsubscribe = subscribeToTransitionChecklist(() => {
      // Any change re-fetches the full checklist so the rollup stays consistent
      // (a single-row payload isn't enough to recompute phase/pillar aggregates).
      getTransitionProgress().then(res => {
        if (!cancelled && res.data) setProgress(res.data)
      })
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return (
    <section className={`relative flex items-center justify-center overflow-hidden py-16 md:py-20 ${HERO_MIN_HEIGHT}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-signal-teal/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {loading || !progress ? (
          <HeroSkeleton />
        ) : (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8">
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-umbral-ash/30 border border-signal-teal/30 text-signal-teal text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-teal opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-teal" />
                </span>
                {t('landing.hero.badge')}
              </span>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                <span className="text-gradient">{t('installingDemocracy.titleHighlight')}</span>
                <span className="text-white"> {t('installingDemocracy.titleRest')}</span>
              </h1>
              <p className="text-base md:text-lg text-umbral-muted max-w-2xl mx-auto leading-relaxed">
                {t('installingDemocracy.summary')}
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="max-w-5xl mx-auto text-center">
              <DominoPhaseBar progress={progress} showCaption={false} />
            </motion.div>

            {/* Same max-width as the Domino bar above so the two align. */}
            <motion.div variants={fadeInUp} className="max-w-5xl mx-auto">
              <MilestoneCountdownRow variant="chip" />
            </motion.div>

            <motion.div variants={fadeInUp} className="flex justify-center">
              <Link
                href="/installing-democracy"
                className="btn btn-primary text-base px-8 py-3 group inline-flex items-center"
              >
                {t('installingDemocracy.cta')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function HeroSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="h-12 md:h-16 bg-umbral-ash/30 rounded-lg w-2/3 mx-auto" />
        <div className="h-4 bg-umbral-ash/20 rounded w-full max-w-2xl mx-auto" />
        <div className="h-4 bg-umbral-ash/20 rounded w-3/4 max-w-xl mx-auto" />
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        <div className="h-10 bg-umbral-ash/20 rounded w-24" />
        <div className="h-3 bg-umbral-ash/30 rounded-md w-full" />
      </div>
      <div className="max-w-3xl mx-auto flex gap-2 justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 w-36 bg-umbral-ash/20 rounded-lg" />
        ))}
      </div>
      <div className="flex justify-center">
        <div className="h-12 w-48 bg-umbral-ash/30 rounded-lg" />
      </div>
    </div>
  )
}
