'use client'

import { MilestoneCountdown } from './MilestoneCountdown'
import { TRANSITION_MILESTONES } from '@/data/transition-milestones'
import type { TransitionProgress } from '@/types'

interface MilestoneCountdownRowProps {
  variant?: 'full' | 'chip'
  /** Drives the completion bar over each countdown. Omit (or pass null while
   *  loading) and the countdowns render exactly as they did before. */
  progress?: TransitionProgress | null
}

export function MilestoneCountdownRow({ variant = 'full', progress }: MilestoneCountdownRowProps) {
  // Keyed by id rather than zipped by index: the two arrays are built from the
  // same source, but a lookup can't silently mis-pair a bar with a countdown.
  const deadlineById = new Map((progress?.deadlines ?? []).map(d => [d.milestoneId, d]))

  return (
    <div
      className={
        variant === 'chip'
          ? // Stacked on mobile, all three on one line from md up. A grid (not
            // a scrolling flex row) so every chip is equal width and nothing is
            // hidden off-screen behind a horizontal scroll.
            'grid grid-cols-1 md:grid-cols-3 gap-2'
          : 'grid grid-cols-1 sm:grid-cols-3 gap-4'
      }
    >
      {TRANSITION_MILESTONES.map(milestone => (
        <MilestoneCountdown
          key={milestone.id}
          milestone={milestone}
          variant={variant}
          deadline={deadlineById.get(milestone.id)}
        />
      ))}
    </div>
  )
}
