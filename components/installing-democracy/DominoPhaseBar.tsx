'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'
import { PHASE_KEY_BY_NUMBER } from '@/lib/transition'
import type { TransitionProgress } from '@/types'

interface DominoPhaseBarProps {
  progress: TransitionProgress
  /** Month + expert-assessed % caption under each segment. Default true. */
  showCaption?: boolean
  /** The big "{pct}%" headline number. Default true — set false when a
   * percentage is already shown elsewhere on the page, to avoid duplicating it. */
  showPercent?: boolean
}

const PENDING_TRACK = 'rgba(228, 228, 231, 0.8)' // #e4e4e7 at ~80% opacity per spec §9/§10

// Depth (px) of the chevron point/notch on each segment's right/left edge.
// Fixed in pixels rather than a percentage so the arrow stays a consistent,
// legible slant instead of vanishing at narrow (320px) widths.
const CHEVRON_NOTCH = 10

/**
 * Chevron/arrow silhouette per segment, styled after a Domino's-style stage
 * tracker: a pointed right edge and a matching notch on the left, so
 * consecutive segments interlock into one continuous arrow-flow pill. The
 * first segment gets a flat left edge and the last a flat right edge — the
 * chevron row's own `rounded-full overflow-hidden` rounds those two ends off.
 */
function segmentClipPath(index: number, total: number): string {
  const n = `${CHEVRON_NOTCH}px`
  if (total <= 1) return 'none'
  if (index === 0) {
    return `polygon(0 0, calc(100% - ${n}) 0, 100% 50%, calc(100% - ${n}) 100%, 0 100%)`
  }
  if (index === total - 1) {
    return `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${n} 50%)`
  }
  return `polygon(0 0, calc(100% - ${n}) 0, 100% 50%, calc(100% - ${n}) 100%, 0 100%, ${n} 50%)`
}

/**
 * Two-word titles ("Instituciones electorales", "Elección fundacional") break
 * after the first word so they occupy two shorter lines instead of one long
 * one — matters most for the mobile diagonal label, where a shorter run means
 * a shorter rise, but kept for desktop too so both stay visually compact.
 * Single-word titles pass through unchanged.
 */
function renderTitle(title: string) {
  const words = title.trim().split(' ')
  if (words.length < 2) return title
  return (
    <>
      {words[0]}
      <br />
      {words.slice(1).join(' ')}
    </>
  )
}

export function DominoPhaseBar({ progress, showCaption = true, showPercent = true }: DominoPhaseBarProps) {
  const { t } = useTranslation()
  const [openTooltip, setOpenTooltip] = useState<number | null>(null)
  const isAllComplete = progress.completionPct === 100
  const total = progress.phases.length
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="w-full">
      {/* Headline */}
      <div className="text-center">
        {showPercent && (
          <p className="text-4xl md:text-5xl font-bold text-white font-display">
            {progress.completionPct}%
          </p>
        )}
        <p className={cn('text-base md:text-lg text-umbral-muted', showPercent && 'mt-1')}>
          {t('installingDemocracy.bar.completedOf')
            .replace('{completed}', String(progress.completed))
            .replace('{total}', String(progress.total))}
          {progress.inProgress > 0 && (
            <>
              {' · '}
              {t('installingDemocracy.bar.inProgress').replace('{count}', String(progress.inProgress))}
            </>
          )}
        </p>
      </div>

      {/* Milestone names, mobile — 45° diagonal labels, subway-map style.
          Anchored at each segment's CENTER (not its leading edge): the label
          is first centered on that point as if horizontal (translateX -50%),
          then rotated around its own center, so it reads as pinned to the
          middle of its segment rather than running off from a start point. */}
      <div className="relative h-16 mt-4 mb-4 md:hidden">
        {progress.phases.map((phase, index) => {
          const key = PHASE_KEY_BY_NUMBER[phase.phase]
          const title = t(`installingDemocracy.phases.${key}.title`)
          const isActive = phase.isActive && !isAllComplete
          return (
            <p
              key={phase.phase}
              className={cn(
                'absolute whitespace-nowrap leading-tight',
                'text-[9px] font-medium',
                isActive ? 'text-white' : 'text-umbral-muted'
              )}
              style={{
                left: `${((index + 0.5) / total) * 100}%`,
                // `transform` only affects paint, not layout — a rotated box's
                // pixels can dip below its own box into the bar below even
                // though the anchor is at bottom:0. Anchoring higher up
                // (bottom: 14px instead of 0) gives the rotated corner real
                // clearance before it would reach the bar.
                bottom: '14px',
                transform: 'translateX(-50%) rotate(-45deg)',
                transformOrigin: 'center',
              }}
            >
              {renderTitle(title)}
            </p>
          )
        })}
      </div>

      {/* Milestone names, desktop — plain horizontal row, centered per segment.
          Columns are bottom-aligned (flex-col justify-end): the row stretches
          to fit the tallest title (the two-line ones), and justify-end pins
          every title's LAST line to that same bottom edge — so a one-line
          title like "Libertad" sits the same distance from the bar as a
          two-line one, instead of floating higher with empty space beneath it. */}
      <div className="hidden md:flex mt-4 mb-1">
        {progress.phases.map(phase => {
          const key = PHASE_KEY_BY_NUMBER[phase.phase]
          const title = t(`installingDemocracy.phases.${key}.title`)
          const isActive = phase.isActive && !isAllComplete
          return (
            <div key={phase.phase} className="flex-1 min-w-0 flex flex-col justify-end">
              <p
                className={cn(
                  'text-sm md:text-base font-medium px-1 leading-tight text-center break-words',
                  isActive ? 'text-white' : 'text-umbral-muted'
                )}
              >
                {renderTitle(title)}
              </p>
            </div>
          )
        })}
      </div>

      {/* Rail — interlocking chevron segments, Domino's-tracker style. This
          is the ONLY row with rounded-full overflow-hidden (needed to round
          off the two pill end-caps), so it's the only thing that can ever be
          clipped by it. */}
      <div
        role="progressbar"
        aria-valuenow={progress.completionPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('installingDemocracy.bar.overallLabel')}
      >
        <div className="flex rounded-full overflow-hidden">
          {progress.phases.map((phase, index) => {
            const key = PHASE_KEY_BY_NUMBER[phase.phase]
            const description = t(`installingDemocracy.phases.${key}.description`)
            const isActive = phase.isActive && !isAllComplete

            return (
              <div key={phase.phase} className="flex-1 min-w-0">
                <div
                  className="relative h-16 cursor-help"
                  style={{
                    // Segment N's point and segment N+1's notch are each computed
                    // relative to their own box and meet at the shared edge when
                    // placed with zero gap — no overlap/negative-margin needed.
                    // The 1px overlap here only papers over sub-pixel seam gaps.
                    clipPath: segmentClipPath(index, total),
                    marginLeft: index === 0 ? 0 : -1,
                    zIndex: total - index,
                    backgroundColor: isAllComplete ? '#14b8a6' : PENDING_TRACK,
                  }}
                  onMouseEnter={() => setOpenTooltip(phase.phase)}
                  onMouseLeave={() => setOpenTooltip(null)}
                  onClick={() => setOpenTooltip(prev => (prev === phase.phase ? null : phase.phase))}
                  title={description}
                >
                  {/* Single continuous teal fill to the milestone's expert-
                      assessed completionPct — no amber in-progress overlay:
                      completion is now continuous from expert scores, not a
                      discrete admin status. */}
                  {!isAllComplete && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-signal-teal"
                      initial={{ width: 0 }}
                      animate={{ width: `${phase.completionPct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  )}

                  {/* Active-phase pulse. This has to be an INNER overlay: an
                      outer drop-shadow glow is invisible here because the
                      segment's own clip-path (applied after filters) and the
                      rail's overflow-hidden both discard anything painted
                      outside the chevron silhouette. */}
                  {isActive &&
                    (prefersReducedMotion ? (
                      <div className="absolute inset-0 bg-signal-teal/25 pointer-events-none" />
                    ) : (
                      <motion.div
                        className="absolute inset-0 bg-signal-teal pointer-events-none"
                        animate={{ opacity: [0.1, 0.5, 0.1] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Month + completed/total captions — plain row, kept structurally
          outside the clipped chevron row (same reasoning as the titles row
          above). Close to the bar but with enough gap to read as separate
          from it rather than overlapping. */}
      {showCaption && (
        <div className="flex mt-2">
          {progress.phases.map(phase => {
            const key = PHASE_KEY_BY_NUMBER[phase.phase]
            const month = t(`installingDemocracy.phases.${key}.month`)
            return (
              <div key={phase.phase} className="flex-1 min-w-0">
                <p className="text-[9px] md:text-[10px] text-umbral-muted text-center font-mono">
                  {month} · {phase.completionPct}%
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Mobile tap-to-expand description (desktop gets it via the native
          `title` tooltip on the chevron itself). Also a plain row. */}
      <div className="md:hidden">
        {progress.phases.map(phase => {
          if (openTooltip !== phase.phase) return null
          const key = PHASE_KEY_BY_NUMBER[phase.phase]
          const description = t(`installingDemocracy.phases.${key}.description`)
          return (
            <div
              key={phase.phase}
              className="mt-1 text-[10px] text-umbral-light bg-umbral-charcoal border border-umbral-ash rounded-md p-2"
              role="tooltip"
            >
              {description}
            </div>
          )
        })}
      </div>

      {isAllComplete && (
        <div className="flex items-center gap-2 text-signal-teal text-sm font-medium justify-center pt-2">
          <CheckCircle2 className="w-4 h-4" />
          {t('installingDemocracy.bar.complete')}
        </div>
      )}
    </div>
  )
}
