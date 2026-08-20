'use client'

import { BookMarked, ExternalLink } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { TRANSITION_REFERENCES } from '@/data/transition-references'

// One template shared by the header row and every entry, so the columns can
// never drift apart. Below `md` the grid is off entirely and each entry stacks.
const COLUMNS = 'md:grid md:grid-cols-[1fr_13rem_6.5rem] md:gap-x-6'

interface ReferencesPanelProps {
  /** Anchor target, so the methodology panel can link to this block. */
  id?: string
}

export function ReferencesPanel({ id }: ReferencesPanelProps) {
  const { t, locale } = useTranslation()
  const isEs = locale === 'es'

  return (
    <div id={id} className="card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookMarked className="w-4 h-4 text-signal-teal shrink-0" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          {t('installingDemocracy.references.title')}
        </h2>
      </div>

      {/* Presentational: the same labels are attached to each value as sr-only
          text, so screen readers get them in the stacked layout too. */}
      <div
        aria-hidden="true"
        className={`${COLUMNS} hidden pb-2 mb-1 border-b border-umbral-ash/60 text-[10px] font-mono uppercase tracking-wider text-umbral-muted`}
      >
        <span>{t('installingDemocracy.references.source')}</span>
        <span>{t('installingDemocracy.references.type')}</span>
        <span>{t('installingDemocracy.references.date')}</span>
      </div>

      <ul className="divide-y divide-umbral-ash/40">
        {TRANSITION_REFERENCES.map(reference => {
          const type = isEs ? reference.typeEs : reference.typeEn
          const date = isEs ? reference.dateEs : reference.dateEn

          return (
            <li key={reference.id} className={`${COLUMNS} py-3 md:items-baseline`}>
              <p className="text-sm text-umbral-light leading-snug">
                {reference.title}
                {reference.url && (
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1.5 inline-flex align-middle text-signal-teal hover:text-white transition-colors"
                    aria-label={t('installingDemocracy.references.openSource')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}
              </p>

              {/* `md:contents` promotes these two to grid cells at desktop so
                  they land in their own columns; on mobile they stay a single
                  row with the date pushed to the right. */}
              <div className="mt-1.5 flex items-center justify-between gap-3 md:contents">
                <span className="inline-flex items-center rounded border border-umbral-ash bg-umbral-charcoal px-2 py-0.5 text-[11px] font-mono text-umbral-muted md:bg-transparent md:border-0 md:px-0 md:py-0">
                  <span className="sr-only">{t('installingDemocracy.references.type')}: </span>
                  {type}
                </span>
                <span className="shrink-0 text-xs font-mono text-umbral-muted">
                  <span className="sr-only">{t('installingDemocracy.references.date')}: </span>
                  {date || '—'}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
