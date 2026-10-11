'use client'

import { Fragment, useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { MILESTONE_ICONS } from './icons'
import type { TransitionMilestone } from '@/data/transition-milestones'
import type { DeadlineProgress } from '@/types'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  reached: boolean
}

function computeTimeLeft(targetIso: string): TimeLeft {
  const diff = new Date(targetIso).getTime() - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, reached: true }
  }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    reached: false,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * HH : MM : SS with a unit label under each number. Shared by both variants so
 * the two stay in sync; `size` is the only difference between them.
 */
function ClockSegments({
  timeLeft,
  size,
  className,
}: {
  timeLeft: TimeLeft
  size: 'sm' | 'lg'
  className?: string
}) {
  const { t } = useTranslation()
  const isLg = size === 'lg'

  const segments = [
    { value: timeLeft.hours, label: t('installingDemocracy.milestones.hours') },
    { value: timeLeft.minutes, label: t('installingDemocracy.milestones.minutes') },
    { value: timeLeft.seconds, label: t('installingDemocracy.milestones.seconds') },
  ]

  const numberClass = isLg ? 'text-2xl md:text-3xl' : 'text-lg'
  const labelClass = isLg ? 'text-[9px]' : 'text-[8px]'

  return (
    // items-start keeps the colons on the number line rather than centering
    // them against the number + label block.
    <div className={cn('flex items-start', isLg ? 'gap-1.5' : 'gap-1', className)}>
      {segments.map((seg, i) => (
        <Fragment key={seg.label}>
          {i > 0 && (
            <span
              className={cn(
                'font-bold font-mono text-umbral-muted leading-none',
                numberClass
              )}
            >
              :
            </span>
          )}
          <div className="text-center">
            <p
              className={cn(
                'font-bold font-mono text-white tabular-nums leading-none',
                numberClass
              )}
            >
              {pad(seg.value)}
            </p>
            <p
              className={cn(
                'uppercase tracking-wide text-umbral-muted leading-none mt-1',
                labelClass
              )}
            >
              {seg.label}
            </p>
          </div>
        </Fragment>
      ))}
    </div>
  )
}

/**
 * Expert-assessed completion of the actions due by this deadline.
 *
 * Rendered OUTSIDE the countdown box, above it, at the same type scale as the
 * day counter inside — this figure is meant to carry equal weight to the
 * page's headline percentage, not sit beneath the clock as a footnote.
 *
 * Cumulative, so the longest deadline's bar equals that headline exactly. Same
 * light rail + teal fill as the action cards' completion bar, because it is
 * the same measure rolled up.
 */
function DeadlineBar({ deadline, size }: { deadline: DeadlineProgress; size: 'sm' | 'lg' }) {
  const { t } = useTranslation()
  const isLg = size === 'lg'
  const pct = deadline.completionPct

  return (
    // Centered to match the day counter inside the box below, which is itself
    // centered — left-aligning these made the two read as separate columns.
    <div className="text-center" aria-hidden="true">
      <p
        className={cn(
          'font-bold font-mono text-white tabular-nums leading-none',
          // Matches each variant's own day counter: text-5xl/6xl in the card,
          // text-3xl in the chip.
          isLg ? 'text-5xl md:text-6xl' : 'text-3xl'
        )}
      >
        {pct}%
      </p>
      <div
        className={cn(
          'rounded-full bg-[#e4e4e7]/80 overflow-hidden',
          isLg ? 'h-2.5 mt-3' : 'h-1.5 mt-2'
        )}
      >
        <div
          className="h-full bg-signal-teal transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p
        className={cn(
          'uppercase tracking-wide font-mono text-umbral-muted leading-none',
          isLg ? 'text-[11px] mt-2' : 'text-[10px] mt-1.5'
        )}
      >
        {t('installingDemocracy.milestones.actionsDue').replace('{count}', String(deadline.total))}
      </p>
    </div>
  )
}

interface MilestoneCountdownProps {
  milestone: TransitionMilestone
  variant?: 'full' | 'chip'
  /** Undefined while progress is still loading — the bar is simply omitted,
   *  rather than rendering a misleading empty 0% rail. */
  deadline?: DeadlineProgress
}

export function MilestoneCountdown({ milestone, variant = 'full', deadline }: MilestoneCountdownProps) {
  const { t, locale } = useTranslation()
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => computeTimeLeft(milestone.targetIso))

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      setTimeLeft(computeTimeLeft(milestone.targetIso))
      // Re-align to the next wall-clock second rather than using a fixed
      // setInterval, which drifts from whenever each instance happened to
      // mount — that left the three countdowns ticking a few ms apart.
      timeoutId = setTimeout(tick, 1000 - (Date.now() % 1000))
    }

    tick()
    return () => clearTimeout(timeoutId)
  }, [milestone.targetIso])

  const label = t(`installingDemocracy.milestones.${milestone.id}`)
  const targetDate = new Date(milestone.targetIso).toLocaleDateString(
    locale === 'es' ? 'es-VE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )
  // "1 días" would be wrong — the unit label agrees with the number.
  const daysLabel = t(
    timeLeft.days === 1
      ? 'installingDemocracy.milestones.daysSingular'
      : 'installingDemocracy.milestones.days'
  )
  // Falls back to the generic Clock so an unmapped milestone id can never
  // render an empty slot / crash the row.
  const Icon = MILESTONE_ICONS[milestone.id] ?? Clock

  // The ticking digits are aria-hidden and marked aria-live="off" so screen
  // readers aren't spammed once per second; a static, fully-worded summary is
  // exposed instead (spec §9 accessibility).
  // The bar itself is aria-hidden, so its numbers are folded into this static
  // summary instead — otherwise the completion figure would be invisible to
  // screen readers entirely.
  const dueSummary = deadline
    ? ` — ${deadline.completionPct}% — ${t('installingDemocracy.milestones.actionsDue').replace('{count}', String(deadline.total))}`
    : ''
  const srSummary = timeLeft.reached
    ? `${label} — ${t('installingDemocracy.milestones.reached')} — ${targetDate}${dueSummary}`
    : `${label} — ${timeLeft.days} ${daysLabel} — ${targetDate}${dueSummary}`

  if (variant === 'chip') {
    return (
      // The bar sits outside the chip box; the wrapper is what the grid lays
      // out now. h-full + flex-1 on the box keeps the three chips bottom-
      // aligned even though the bar block above them is a fixed height.
      <div className="flex flex-col h-full">
        {deadline && <DeadlineBar deadline={deadline} size="sm" />}

        <div
          className={cn(
            'w-full min-w-0 px-3 py-2.5 rounded-lg bg-umbral-charcoal/80 border border-umbral-ash flex items-center gap-3',
            deadline && 'mt-3 flex-1'
          )}
        >
          <Icon className="w-10 h-10 text-signal-teal shrink-0" aria-hidden="true" />

          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] text-umbral-muted uppercase tracking-wide font-mono mb-1 leading-snug"
              aria-hidden="true"
            >
              {label}
            </p>

            {timeLeft.reached ? (
              <p className="text-sm font-bold text-signal-teal font-mono" aria-hidden="true">
                {t('installingDemocracy.milestones.reached')}
              </p>
            ) : (
              // flex-wrap so the clock drops below the day count instead of
              // overflowing if the chip is ever too narrow for both.
              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-1.5"
                aria-hidden="true"
                aria-live="off"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold text-white font-mono tabular-nums leading-none">
                    {timeLeft.days}
                  </p>
                  <p className="text-[8px] uppercase tracking-wide text-umbral-muted leading-none mt-1">
                    {daysLabel}
                  </p>
                </div>
                <ClockSegments timeLeft={timeLeft} size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Outside the box, so it covers the bar above it as well as the clock. */}
        <span className="sr-only">{srSummary}</span>
      </div>
    )
  }

  return (
    // Same shape as the chip: bar outside, box below, both inside a wrapper
    // that is what the grid actually lays out.
    <div className="flex flex-col h-full">
      {deadline && <DeadlineBar deadline={deadline} size="lg" />}

      <div className={cn('card p-4 md:p-5 flex flex-col gap-3', deadline ? 'mt-4 flex-1' : 'h-full')}>
        <div className="flex items-center gap-2 text-umbral-muted" aria-hidden="true">
          <Icon className="w-4 h-4 text-signal-teal shrink-0" />
          <p className="text-xs md:text-sm font-medium leading-snug">{label}</p>
        </div>

      {timeLeft.reached ? (
        <p className="text-2xl font-bold text-signal-teal font-mono text-center py-2" aria-hidden="true">
          {t('installingDemocracy.milestones.reached')}
        </p>
      ) : (
        // Always stacked, never side-by-side: with flex-wrap, a 2-digit day
        // count (81) fit on one line while 3-digit ones (139, 535) wrapped,
        // so the three cards didn't match each other.
        <div className="text-center py-1" aria-hidden="true" aria-live="off">
          <p className="text-5xl md:text-6xl font-bold font-mono text-white tabular-nums leading-none">
            {timeLeft.days}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-umbral-muted mt-1">
            {daysLabel}
          </p>
          <ClockSegments timeLeft={timeLeft} size="lg" className="mt-5 justify-center" />
        </div>
      )}

        <p className="text-[10px] text-umbral-muted font-mono mt-auto text-center" aria-hidden="true">
          {targetDate}
        </p>
      </div>

      {/* Outside the box, so it covers the bar above it as well as the clock. */}
      <span className="sr-only">{srSummary}</span>
    </div>
  )
}
