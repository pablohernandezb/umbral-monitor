'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, LogOut, Save, CheckCircle2, CalendarDays } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { getTransitionChecklist } from '@/lib/data'
import {
  getMyEvaluations,
  saveEvaluations,
  getMyComments,
  saveComment,
  deleteComment,
} from '@/app/installing-democracy/participate/actions'
import { TRANSITION_PHASES, phaseForMonth, currentRoadmapMonth, ROADMAP_TOTAL_MONTHS } from '@/data/transition-phases'
import { ChecklistActionCard } from './ChecklistActionCard'
import type { TransitionAction, EvaluationMap, CommentMap } from '@/types'

interface EvaluationFormProps {
  code: string
  onSignOut: () => void
}

/** The Returning Expert evaluation view (monitoring spec §8.3): all 60 actions
 * grouped by the 6 roadmap milestones, each with a 0–4 LikertSelector. */
export function EvaluationForm({ code, onSignOut }: EvaluationFormProps) {
  const { t } = useTranslation()
  const [actions, setActions] = useState<TransitionAction[]>([])
  const [scores, setScores] = useState<EvaluationMap>({})
  // The last-persisted state, used at save time to work out which ids were
  // cleared: a cleared id is simply absent from `scores` now, which is
  // indistinguishable from "never touched" unless compared against what was
  // actually saved before.
  const [savedScores, setSavedScores] = useState<EvaluationMap>({})
  const [comments, setComments] = useState<CommentMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [checklistRes, evalRes, commentsRes] = await Promise.all([
        getTransitionChecklist(),
        getMyEvaluations(code),
        getMyComments(code),
      ])
      if (cancelled) return
      if (checklistRes.data) setActions(checklistRes.data)
      if (evalRes.ok) {
        setScores(evalRes.evaluations)
        setSavedScores(evalRes.evaluations)
      }
      if (commentsRes.ok) setComments(commentsRes.comments)
      setLoading(false)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [code])

  // Comments are instant-save (not batched with scores) — each call updates
  // local state only after the server confirms, so a failed save doesn't
  // silently drift from what's actually persisted.
  async function handleSaveComment(actionId: string, body: string) {
    const result = await saveComment(code, actionId, body)
    if (result.ok) {
      setComments(prev => ({ ...prev, [actionId]: body.trim() }))
    }
    return result
  }

  async function handleDeleteComment(actionId: string) {
    const result = await deleteComment(code, actionId)
    if (result.ok) {
      setComments(prev => {
        const next = { ...prev }
        delete next[actionId]
        return next
      })
    }
    return result
  }

  const grouped = useMemo(() => {
    const map = new Map<number, TransitionAction[]>()
    for (const def of TRANSITION_PHASES) map.set(def.phase, [])
    for (const action of actions) {
      map.get(phaseForMonth(action.month))?.push(action)
    }
    return map
  }, [actions])

  const ratedCount = Object.keys(scores).length
  // Static per mount — a month-granularity readout doesn't need to tick.
  const roadmapMonth = useMemo(() => currentRoadmapMonth(), [])

  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)
    // Anything present in the last-saved baseline but no longer in the
    // working scores was explicitly cleared and needs a real delete.
    const clearedIds = Object.keys(savedScores).filter(id => scores[id] === undefined)
    const result = await saveEvaluations(code, scores, clearedIds)
    setSaving(false)

    if (!result.ok) {
      setSaveMessage({ text: t('installingDemocracy.participate.eval.saveError'), isError: true })
      return
    }
    setSavedScores(scores)
    setSaveMessage({ text: t('installingDemocracy.participate.eval.saved'), isError: false })
  }

  function handleEvaluate(actionId: string, score: number | undefined) {
    setScores(prev => {
      if (score === undefined) {
        const next = { ...prev }
        delete next[actionId]
        return next
      }
      return { ...prev, [actionId]: score }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-signal-teal animate-spin" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sticky progress + save bar */}
      <div className="sticky top-16 z-20 -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="card p-3 md:p-4 bg-umbral-black/95 backdrop-blur-md space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Left group — current calendar month, then the rated count with
                breathing space between the two. Gold matches the CalendarDays
                "milestone" convention used on each action card (flag key:
                gold=milestone, blue=pillar, red=actor). */}
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
              <span className="text-sm font-mono text-white">
                {t('installingDemocracy.participate.eval.currentMonth', {
                  month: roadmapMonth,
                  total: ROADMAP_TOTAL_MONTHS,
                })}
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-8">
              <CheckCircle2 className="w-4 h-4 text-signal-teal shrink-0" aria-hidden="true" />
              <p className="text-sm font-mono text-white">
                {t('installingDemocracy.participate.eval.progress', { rated: ratedCount, total: actions.length })}
              </p>
            </div>

            {/* Right — sign out / save */}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-umbral-muted hover:text-white transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                {t('installingDemocracy.participate.eval.signOut')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary inline-flex items-center gap-2 px-4 py-1.5 text-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                {saving
                  ? t('installingDemocracy.participate.eval.saving')
                  : t('installingDemocracy.participate.eval.save')}
              </button>
            </div>
          </div>

          {saveMessage && (
            <p className={`text-center text-xs ${saveMessage.isError ? 'text-signal-red' : 'text-signal-teal'}`}>
              {saveMessage.text}
            </p>
          )}

          {/* Milestone jump links — anchor to each section's id below.
              Native fragment scroll (html has scroll-smooth) rather than a JS
              scrollIntoView, since this is a normal page, not an overlay with
              its own scroll container. */}
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
            <span className="shrink-0 whitespace-nowrap text-[10px] font-mono text-umbral-muted">
              {t('installingDemocracy.participate.eval.jumpToMilestone')}
            </span>
            {TRANSITION_PHASES.map(def => (
              <a
                key={def.phase}
                href={`#milestone-${def.phase}`}
                className="shrink-0 whitespace-nowrap rounded-md border border-umbral-ash px-2.5 py-1 text-[10px] font-mono text-umbral-muted transition-colors hover:border-signal-teal/50 hover:text-white"
              >
                {t(`installingDemocracy.phases.${def.key}.title`)}
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-umbral-muted">{t('installingDemocracy.participate.eval.instructions')}</p>

      {TRANSITION_PHASES.map(def => {
        const phaseActions = grouped.get(def.phase) ?? []
        const rated = phaseActions.filter(a => scores[a.id] !== undefined).length
        return (
          <div key={def.phase} id={`milestone-${def.phase}`} className="scroll-mt-48 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                {t(`installingDemocracy.phases.${def.key}.title`)}
              </h2>
              <p className="text-xs font-mono text-umbral-muted">
                {rated}/{phaseActions.length}
              </p>
            </div>
            <p className="text-xs text-umbral-muted">
              {t(`installingDemocracy.phases.${def.key}.description`)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {phaseActions.map(action => (
                <ChecklistActionCard
                  key={action.id}
                  action={action}
                  evaluate
                  evaluationValue={scores[action.id]}
                  onEvaluate={score => handleEvaluate(action.id, score)}
                  comment={comments[action.id]}
                  onSaveComment={body => handleSaveComment(action.id, body)}
                  onDeleteComment={() => handleDeleteComment(action.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
