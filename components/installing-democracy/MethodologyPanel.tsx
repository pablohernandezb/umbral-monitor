'use client'

import { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { ReferencesPanel } from './ReferencesPanel'
import { PILLAR_ICONS } from './icons'
import {
  METHODOLOGY_BLOCKS,
  METHODOLOGY_REFERENCES_ID,
  type MethodologyBlock,
  type MethodologyInline,
  type MethodologyStatusItem,
} from '@/data/transition-methodology'

interface MethodologyPanelProps {
  open: boolean
  onClose: () => void
}

/** Dot colour per status tone, mirroring the checklist card palette. */
const TONE_DOT: Record<MethodologyStatusItem['tone'], string> = {
  completed: 'bg-signal-teal',
  inProgress: 'bg-signal-amber',
  pending: 'bg-signal-red',
  unrated: 'bg-umbral-muted',
}

/**
 * English falls back to Spanish. The source document is Spanish-only, so an
 * untranslated block must still render its original text rather than vanish.
 */
function pickCopy<T>(es: T, en: T | undefined, isEs: boolean): T {
  if (isEs) return es
  return en ?? es
}

function InlineRun({
  run,
  onAnchor,
}: {
  run: MethodologyInline
  onAnchor: (id: string) => void
}) {
  if (typeof run === 'string') return <>{run}</>

  if ('href' in run) {
    return (
      <a
        href={run.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-signal-teal underline underline-offset-2 hover:text-white transition-colors"
      >
        {run.text}
      </a>
    )
  }

  // In-panel jump. Kept as a real anchor for semantics, but handled in JS so it
  // scrolls the panel's own scroll container without pushing a history entry —
  // a hash entry here would make the back button undo the jump instead of
  // closing the panel.
  return (
    <a
      href={`#${run.anchor}`}
      onClick={event => {
        event.preventDefault()
        onAnchor(run.anchor)
      }}
      className="text-signal-teal underline underline-offset-2 hover:text-white transition-colors"
    >
      {run.text}
    </a>
  )
}

function Block({
  block,
  isEs,
  onAnchor,
}: {
  block: MethodologyBlock
  isEs: boolean
  onAnchor: (id: string) => void
}) {
  if (block.type === 'status') {
    return (
      <ul className="space-y-2.5 my-5">
        {block.items.map(item => {
          const label = pickCopy(item.labelEs, item.labelEn, isEs)
          const range = pickCopy(item.rangeEs, item.rangeEn, isEs)
          const body = pickCopy(item.bodyEs, item.bodyEn, isEs)

          return (
            <li
              key={item.tone}
              className="flex gap-3 rounded-lg border border-umbral-ash bg-umbral-charcoal/60 p-3"
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOT[item.tone]}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {label}
                  {range && (
                    <span className="ml-2 font-mono text-xs font-normal text-umbral-muted">
                      {range}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-umbral-muted">{body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    )
  }

  if (block.type === 'chips') {
    return (
      <div className="my-4 flex flex-wrap gap-2">
        {block.items.map(chip => {
          const Icon = PILLAR_ICONS[chip.icon]
          return (
            <span
              key={chip.icon}
              className="inline-flex items-center gap-1.5 rounded border border-umbral-ash bg-umbral-charcoal px-2.5 py-1 text-xs text-umbral-light"
            >
              {/* Blue matches the pillar icons on the tracker itself
                  (Venezuelan flag key: gold = milestone, blue = pillar,
                  red = actors). */}
              {Icon && (
                <Icon className="h-3.5 w-3.5 shrink-0 text-signal-blue" aria-hidden="true" />
              )}
              {pickCopy(chip.es, chip.en, isEs)}
            </span>
          )
        })}
      </div>
    )
  }

  if (block.type === 'ul') {
    const items = pickCopy(block.es, block.en, isEs)
    return (
      <ul className="my-3 space-y-1.5 pl-1">
        {items.map(item => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-umbral-muted">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-signal-teal" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  const runs = pickCopy(block.es, block.en, isEs)
  const children = runs.map((run, index) => (
    <InlineRun key={index} run={run} onAnchor={onAnchor} />
  ))

  if (block.type === 'h2') {
    return (
      <h2 className="mt-9 mb-3 text-xl md:text-2xl font-bold text-white first:mt-0">{children}</h2>
    )
  }

  if (block.type === 'h3') {
    return <h3 className="mt-7 mb-2 text-base font-semibold text-white">{children}</h3>
  }

  if (block.type === 'flow') {
    return (
      <p className="my-4 rounded-lg border border-signal-teal/30 bg-signal-teal/5 px-4 py-3 text-center font-mono text-xs md:text-sm text-signal-teal">
        {children}
      </p>
    )
  }

  return <p className="my-3 text-sm md:text-base leading-relaxed text-umbral-muted">{children}</p>
}

export function MethodologyPanel({ open, onClose }: MethodologyPanelProps) {
  const { t, locale } = useTranslation()
  const isEs = locale === 'es'
  const scrollRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const scrollToAnchor = useCallback((id: string) => {
    const target = scrollRef.current?.querySelector(`#${CSS.escape(id)}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Escape to dismiss, plus a Tab cycle so keyboard focus cannot wander onto
  // the page behind — `aria-modal` tells assistive tech the background is inert
  // but does nothing to stop Tab itself.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Lock the page behind the overlay, and hand focus to the close button so a
  // keyboard user starts inside the dialog. Focus is returned by the trigger.
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  // z-[1100] deliberately clears the site header, which is fixed at z-[1000] —
  // at any lower value the nav bar paints over the dialog and swallows its own
  // close button. Covering the header is correct regardless: aria-modal already
  // claims everything behind the overlay is inert, so leaving the nav clickable
  // would let a reader navigate away from a dialog that says it has focus.
  return (
    <div
      className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-title"
        onClick={event => event.stopPropagation()}
        className="flex h-full w-full max-w-4xl flex-col overflow-hidden border border-umbral-ash bg-umbral-black sm:h-auto sm:max-h-full sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-umbral-ash px-4 py-3 md:px-6 md:py-4">
          <h1
            id="methodology-title"
            className="text-sm font-semibold uppercase tracking-wider text-white font-mono"
          >
            {t('installingDemocracy.methodology.title')}
          </h1>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={t('installingDemocracy.methodology.close')}
            className="ml-auto rounded-md border border-umbral-ash p-1.5 text-umbral-muted transition-colors hover:border-signal-teal/50 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
          {METHODOLOGY_BLOCKS.map((block, index) => (
            <Block key={index} block={block} isEs={isEs} onAnchor={scrollToAnchor} />
          ))}

          {/* Participation FAQ + CTA (monitoring spec §13) — placed after the
              methodology body and before the bibliography, matching where the
              spec's own "before its references" instruction points. */}
          <div className="mt-9 rounded-lg border border-signal-teal/30 bg-signal-teal/5 p-4 md:p-5">
            <h3 className="text-base font-semibold text-white">
              {t('installingDemocracy.methodology.faq.question')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-umbral-muted">
              {t('installingDemocracy.methodology.faq.answer')}
            </p>
            <Link
              href="/installing-democracy/participate"
              className="btn btn-primary mt-4 inline-flex items-center"
            >
              {t('installingDemocracy.methodology.cta')}
            </Link>
          </div>

          {/* The bibliography is repeated here so the panel is self-contained
              and the in-text link has somewhere to land without closing it. */}
          <div className="mt-10">
            <ReferencesPanel id={METHODOLOGY_REFERENCES_ID} />
          </div>
        </div>
      </div>
    </div>
  )
}
