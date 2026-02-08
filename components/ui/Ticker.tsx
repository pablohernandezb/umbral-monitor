'use client'

import { Clock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { daysSince } from '@/lib/utils'

interface TickerProps {
  captureDate: string
  className?: string
}

export function Ticker({ captureDate, className }: TickerProps) {
  const { t } = useTranslation()
  const days = daysSince(captureDate)
  const text = t('ticker.daysSince', { days: String(days) })

  return (
    <div className={className}>
      <div className="bg-umbral-charcoal/80 backdrop-blur-sm border border-umbral-ash rounded-full px-6 py-3 inline-flex items-center gap-3">
        <Clock className="w-4 h-4 text-signal-amber animate-pulse" />
        <p className="text-sm text-umbral-light">
          {text.split(String(days)).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="text-signal-teal font-bold font-mono mx-1">
                  {days}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

// Simple version without translation interpolation complexity
export function TickerSimple({ days }: { days: number }) {
  const { locale } = useTranslation()
  
  const text = locale === 'es'
    ? `Han transcurrido`
    : `It has been`
  
  const textSuffix = locale === 'es'
    ? `días desde los hechos del 3 de enero de 2026`
    : `days since the events of January 3, 2026`

  return (
    <div className="bg-umbral-charcoal/80 backdrop-blur-sm border border-umbral-ash rounded-full px-6 py-3 inline-flex items-center gap-3">
      <Clock className="w-4 h-4 text-signal-amber animate-pulse" />
      <p className="text-sm text-umbral-light">
        {text}{' '}
        <span className="text-signal-teal font-bold font-mono">
          {days}
        </span>{' '}
        {textSuffix}
      </p>
    </div>
  )
}
