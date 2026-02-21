'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Clock, Zap, Landmark, Undo, Vote, RotateCcw, HandFist, Check, type LucideIcon} from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { NewsItem } from '@/types'

interface NewsCardProps {
  item: NewsItem
  compact?: boolean
  className?: string
  onVote?: (newsId: string, scenarioNumber: number) => void
}

// Category colors use English keys for consistency
const categoryColors: Record<string, string> = {
  political: 'bg-signal-red/10 text-signal-red border-signal-red/30',
  economic: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  social: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
  international: 'bg-signal-teal/10 text-signal-teal border-signal-teal/30',
}

// Scenario icons and config — order matches scenarioKeyToNumber (1→5)
const scenarioConfig: { key: string; icon: LucideIcon; number: number }[] = [
  { key: 'regressedAutocracy', icon: HandFist, number: 1 },
  { key: 'revertedLiberalization', icon: RotateCcw, number: 2 },
  { key: 'stabilizedElectoralAutocracy', icon: Vote, number: 3 },
  { key: 'preemptedDemocraticTransition', icon: Undo, number: 4 },
  { key: 'democraticTransition', icon: Landmark, number: 5 },
]

export function NewsCard({ item, compact = false, className, onVote }: NewsCardProps) {
  const { t, locale } = useTranslation()
  const [votedScenarios, setVotedScenarios] = useState<Set<number>>(new Set())

  // Load previously cast votes for this article from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`umbral_votes:${item.id}`)
      if (stored) setVotedScenarios(new Set(JSON.parse(stored) as number[]))
    } catch {}
  }, [item.id])

  // Get localized content
  const headline = locale === 'es' ? item.headline_es : item.headline_en
  const summary = locale === 'es' ? item.summary_es : item.summary_en
  const category = locale === 'es' ? item.category_es : item.category_en

  // Get vote counts for each scenario (with fallback to 0 for null/undefined)
  const getVoteCount = (scenarioNumber: number): number => {
    switch (scenarioNumber) {
      case 1: return item.votes_scenario_1 ?? 0
      case 2: return item.votes_scenario_2 ?? 0
      case 3: return item.votes_scenario_3 ?? 0
      case 4: return item.votes_scenario_4 ?? 0
      case 5: return item.votes_scenario_5 ?? 0
      default: return 0
    }
  }

  const handleVote = (e: React.MouseEvent, scenarioNumber: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (votedScenarios.has(scenarioNumber)) return
    // Persist vote locally before calling the server
    const updated = new Set(votedScenarios)
    updated.add(scenarioNumber)
    setVotedScenarios(updated)
    try {
      localStorage.setItem(`umbral_votes:${item.id}`, JSON.stringify([...updated]))
    } catch {}
    onVote?.(item.id, scenarioNumber)
  }

  if (compact) {
    return (
      <a
        href={item.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'block p-3 rounded-lg bg-umbral-slate/30 border border-umbral-ash',
          'hover:border-umbral-steel hover:bg-umbral-slate/50 transition-all',
          'group',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {item.is_breaking && (
            <span className="flex-shrink-0 mt-1">
              <Zap className="w-4 h-4 text-signal-red animate-pulse" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium leading-snug line-clamp-2 group-hover:text-signal-teal transition-colors">
              {headline}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-umbral-muted">{item.source}</span>
              <span className="text-umbral-steel">·</span>
              <span className="text-xs text-umbral-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(item.published_at, locale)}
              </span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-umbral-muted group-hover:text-signal-teal flex-shrink-0 transition-colors" />
        </div>
      </a>
    )
  }

  return (
    <div
      className={cn(
        'card p-4 hover:border-umbral-steel hover:bg-umbral-slate/30 transition-all group',
        className
      )}
    >
      <a
        href={item.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {item.is_breaking && (
              <span className="badge badge-breaking flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {t('landing.news.breakingNews')}
              </span>
            )}
            <span className={cn('badge border', categoryColors[item.category_en])}>
              {category}
            </span>
          </div>
          <ExternalLink className="w-4 h-4 text-umbral-muted group-hover:text-signal-teal flex-shrink-0 transition-colors" />
        </div>

        <h3 className="text-base font-semibold text-white leading-snug mb-2 group-hover:text-signal-teal transition-colors">
          {headline}
        </h3>

        {summary && (
          <p className="text-sm text-umbral-muted leading-relaxed mb-3 line-clamp-2">
            {summary}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-umbral-muted">
          <span className="font-medium">{item.source}</span>
          <span className="text-umbral-steel">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(item.published_at, locale)}
          </span>
        </div>
      </a>

      {/* Scenario voting buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-umbral-ash">
        {scenarioConfig.map((scenario) => {
          const Icon = scenario.icon
          const voteCount = getVoteCount(scenario.number)
          const voted = votedScenarios.has(scenario.number)
          return (
            <button
              key={scenario.key}
              onClick={(e) => handleVote(e, scenario.number)}
              disabled={voted}
              title={voted
                ? (locale === 'es' ? 'Ya votaste por este escenario' : 'You already voted for this scenario')
                : t(`scenarios.${scenario.key}.name`)
              }
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all text-xs',
                voted
                  ? 'bg-umbral-ash/20 border-umbral-ash/40 text-umbral-muted cursor-not-allowed'
                  : 'bg-signal-blue/20 hover:bg-signal-blue/30 border-signal-blue/30 hover:border-signal-blue/50 text-signal-blue cursor-pointer'
              )}
            >
              {voted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              <span className={cn('text-base font-bold ml-1', voted ? 'text-umbral-muted' : 'text-white')}>
                {voteCount}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
