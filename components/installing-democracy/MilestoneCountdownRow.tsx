'use client'

import { MilestoneCountdown } from './MilestoneCountdown'
import { TRANSITION_MILESTONES } from '@/data/transition-milestones'

interface MilestoneCountdownRowProps {
  variant?: 'full' | 'chip'
}

export function MilestoneCountdownRow({ variant = 'full' }: MilestoneCountdownRowProps) {
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
        <MilestoneCountdown key={milestone.id} milestone={milestone} variant={variant} />
      ))}
    </div>
  )
}
