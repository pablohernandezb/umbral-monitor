'use client'

import { Fragment, useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { MILESTONE_ICONS } from './icons'
import type { TransitionMilestone } from '@/data/transition-milestones'

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

interface MilestoneCountdownProps {
  milestone: TransitionMilestone
  variant?: 'full' | 'chip'
}

export function MilestoneCountdown({ milestone, variant = 'full' }: MilestoneCountdownProps) {
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
  const srSummary = timeLeft.reached
    ? `${label} — ${t('installingDemocracy.milestones.reached')} — ${targetDate}`
    : `${label} — ${timeLeft.days} ${daysLabel} — ${targetDate}`

  if (variant === 'chip') {
    return (
      <div className="w-full min-w-0 px-3 py-2.5 rounded-lg bg-umbral-charcoal/80 border border-umbral-ash flex items-center gap-3">
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

        <span className="sr-only">{srSummary}</span>
      </div>
    )
  }

  return (
    <div className="card p-4 md:p-5 flex flex-col gap-3">
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

      <span className="sr-only">{srSummary}</span>
    </div>
  )
}
