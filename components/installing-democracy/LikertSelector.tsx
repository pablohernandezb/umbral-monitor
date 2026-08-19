'use client'

import { useRef } from 'react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

interface LikertSelectorProps {
  /** Current score, or undefined when this action hasn't been rated yet. */
  value: number | undefined
  /** `undefined` means "cleared back to not evaluated" — fired when the
   * already-selected option is clicked again. */
  onChange: (score: number | undefined) => void
  /** Accessible name for the radiogroup — the action text this rates. */
  actionLabel: string
  disabled?: boolean
}

const SCORES = [0, 1, 2, 3, 4] as const

// Per INSTALLING_DEMOCRACY_MONITORING_SPEC.md §9. Score 3 is the spec's own
// "amber→teal blend" — a literal two-color gradient rather than a single
// token, since it's the one row with no matching design-system color.
const SCORE_STYLE: Record<number, { selected: string; dot?: string }> = {
  0: { selected: 'border-[#e4e4e7] bg-[#e4e4e7] text-[#111113]' },
  1: { selected: 'border-signal-red bg-signal-red text-white' },
  2: { selected: 'border-signal-amber bg-signal-amber text-[#111113]' },
  3: {
    selected: 'border-signal-amber text-[#111113]',
    dot: 'linear-gradient(135deg, #f59e0b, #14b8a6)',
  },
  4: { selected: 'border-signal-teal bg-signal-teal text-white' },
}

/**
 * The 0–4 evaluation control (monitoring spec §8/§9): a real radiogroup, not
 * a styled <select> — arrow keys move the roving selection, and color is
 * never the only signal (every option also carries its number and label).
 */
export function LikertSelector({ value, onChange, actionLabel, disabled }: LikertSelectorProps) {
  const { t } = useTranslation()
  const groupRef = useRef<HTMLDivElement>(null)

  function focusScore(score: number) {
    const el = groupRef.current?.querySelector<HTMLButtonElement>(`[data-score="${score}"]`)
    el?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent, score: number) {
    if (disabled) return
    const index = SCORES.indexOf(score as (typeof SCORES)[number])
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = SCORES[Math.min(index + 1, SCORES.length - 1)]
      onChange(next)
      focusScore(next)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      const prev = SCORES[Math.max(index - 1, 0)]
      onChange(prev)
      focusScore(prev)
    }
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={actionLabel}
      className="grid grid-cols-5 gap-1.5"
    >
      {SCORES.map(score => {
        const isSelected = value === score
        const style = SCORE_STYLE[score]
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={isSelected}
            data-score={score}
            disabled={disabled}
            tabIndex={isSelected || (value === undefined && score === 0) ? 0 : -1}
            // Clicking the already-selected score clears it back to "not
            // evaluated" — the only way to un-rate an action once picked.
            onClick={() => onChange(isSelected ? undefined : score)}
            title={isSelected ? t('installingDemocracy.participate.eval.clearHint') : undefined}
            onKeyDown={event => onKeyDown(event, score)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border px-1.5 py-2 text-center transition-colors',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isSelected
                ? style.selected
                : 'border-umbral-ash bg-umbral-charcoal text-umbral-light hover:border-signal-teal/50'
            )}
            style={isSelected && style.dot ? { background: style.dot } : undefined}
          >
            <span className="font-mono text-sm font-bold">{score}</span>
            <span className="text-[9px] leading-tight">
              {t(`installingDemocracy.participate.likert.${score}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
