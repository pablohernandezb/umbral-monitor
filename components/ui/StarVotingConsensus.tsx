'use client'

import { useState } from 'react'
import { HandFist, RotateCcw, Vote, Undo, Landmark, GraduationCap, Users, Info } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { StarResult } from '@/lib/data'
import type { Scenario } from '@/types'

const SCENARIO_KEY: Record<number, string> = {
  1: 'regressedAutocracy',
  2: 'revertedLiberalization',
  3: 'stabilizedElectoralAutocracy',
  4: 'preemptedDemocraticTransition',
  5: 'democraticTransition',
}

// Colors from ScenarioTrajectoryPanel
const SCENARIO_COLOR: Record<string, string> = {
  regressedAutocracy:            '#7f1d1d',
  revertedLiberalization:        '#b91c1c',
  stabilizedElectoralAutocracy:  '#ef4444',
  preemptedDemocraticTransition: '#7c3aed',
  democraticTransition:          '#2563eb',
}

const SCENARIO_ICON: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  regressedAutocracy:            HandFist,
  revertedLiberalization:        RotateCcw,
  stabilizedElectoralAutocracy:  Vote,
  preemptedDemocraticTransition: Undo,
  democraticTransition:          Landmark,
}

interface PanelProps {
  result: StarResult
  group: 'expert' | 'public'
  scenarios: Scenario[]
}

function ConsensusPanel({ result, group, scenarios }: PanelProps) {
  const { t, locale } = useTranslation()
  const [tooltipOpen, setTooltipOpen] = useState(false)

  const isExpert = group === 'expert'
  const GroupIcon = isExpert ? GraduationCap : Users
  const groupLabel = isExpert
    ? (locale === 'es' ? 'Escenario de consenso entre expertos' : 'Expert Consensus')
    : (locale === 'es' ? 'Escenario de consenso entre ciudadanos' : 'Citizen Consensus')
  const assessmentsLabel = isExpert
    ? (locale === 'es' ? 'evaluaciones de expertos' : 'expert assessments')
    : (locale === 'es' ? 'evaluaciones ciudadanas' : 'citizen assessments')

  const hasData = result.winner !== null && result.totalVoters > 0

  const winnerKey      = result.winner ? SCENARIO_KEY[result.winner] : null
  const winnerScenario = scenarios.find(s => s.key === winnerKey)
  const WinnerIcon     = winnerKey ? SCENARIO_ICON[winnerKey] : null
  const color          = winnerKey ? SCENARIO_COLOR[winnerKey] : '#4b5563'
  const winnerName     = winnerScenario ? t(`scenarios.${winnerScenario.key}.name`) : '—'
  const description    = winnerKey
    ? t(`scenarios.trajectoryPanel.scenarios.${winnerKey}.description`)
    : ''

  // Runoff percentage among those who expressed a preference
  const winnerVotes = result.winner === result.finalist1 ? result.finalist1Votes : result.finalist2Votes
  const pct         = result.totalVoters > 0 ? Math.round((winnerVotes / result.totalVoters) * 100) : null

  // Traffic-light color for the percentage
  const pctColor = pct === null ? '#6b7280'
    : pct >= 66 ? '#22c55e'   // green
    : pct >= 34 ? '#f59e0b'   // amber
    :             '#dc2626'    // red

  return (
    <div
      className="card p-5 flex flex-col gap-4 border-t-2"
      style={{ borderTopColor: hasData ? color : '#374151' }}
    >
      {/* Header row: group label left, info icon right */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <GroupIcon className="w-3 h-3 text-umbral-muted shrink-0" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-umbral-muted">
            {groupLabel}
          </span>
        </div>

        {hasData && winnerScenario && (
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              onFocus={() => setTooltipOpen(true)}
              onBlur={() => setTooltipOpen(false)}
              className="flex items-center justify-center w-6 h-6 rounded-md text-umbral-muted hover:text-white transition-colors"
              aria-label={locale === 'es' ? 'Descripción del escenario' : 'Scenario description'}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {tooltipOpen && (
              <div className="absolute right-0 top-7 w-64 z-20 p-3 rounded-lg border border-umbral-ash bg-umbral-black shadow-lg">
                <p
                  className="text-[10px] font-semibold mb-1.5"
                  style={{ color }}
                >
                  {winnerName}
                </p>
                <p className="text-[10px] text-umbral-muted leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {!hasData ? (
        <p className="text-xs text-umbral-muted italic py-4 text-center">
          {locale === 'es' ? 'Sin datos suficientes' : 'Not enough data yet'}
        </p>
      ) : (
        <>
          {/* Main content: icon left · name center · % right */}
          <div className="flex items-center gap-4">
            {/* Large scenario icon */}
            {WinnerIcon && (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
              >
                <WinnerIcon className="w-8 h-8" style={{ color }} />
              </div>
            )}

            {/* Scenario name — middle */}
            <p className="flex-1 text-lg md:text-2xl font-semibold text-white leading-snug">
              {winnerName}
            </p>

            {/* Large percentage — right */}
            {pct !== null && (
              <span
                className="text-5xl md:text-7xl font-bold tabular-nums leading-none shrink-0"
                style={{ color: pctColor }}
              >
                {pct}%
              </span>
            )}
          </div>

          {/* Footer */}
          <p className="text-[10px] text-umbral-muted">
            {locale === 'es'
              ? `Basado en ${result.totalVoters} ${assessmentsLabel}`
              : `Based on ${result.totalVoters} ${assessmentsLabel}`}
          </p>
        </>
      )}
    </div>
  )
}

interface StarVotingConsensusProps {
  expertResult: StarResult | null
  publicResult: StarResult | null
  scenarios:    Scenario[]
}

export function StarVotingConsensus({ expertResult, publicResult, scenarios }: StarVotingConsensusProps) {
  const emptyResult: StarResult = {
    winner: null, finalist1: null, finalist2: null,
    finalist1Votes: 0, finalist2Votes: 0, noPreferenceVotes: 0,
    totalVoters: 0, scores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
      <ConsensusPanel result={expertResult  ?? emptyResult} group="expert" scenarios={scenarios} />
      <ConsensusPanel result={publicResult  ?? emptyResult} group="public" scenarios={scenarios} />
    </div>
  )
}
