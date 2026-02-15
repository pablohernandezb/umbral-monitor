'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { daysSince } from '@/lib/utils'

interface TickerProps {
  captureDate: string
  className?: string
}

export function Ticker({ captureDate, className }: TickerProps) {
  const { t } = useTranslation()
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(daysSince(captureDate))
  }, [captureDate])

  if (days === null) {
    return (
      <div className={className}>
        <div className="bg-umbral-charcoal/80 backdrop-blur-sm border border-umbral-ash rounded-full px-6 py-3 inline-flex items-center gap-3">
          <Clock className="w-6 h-6 md:w-6 md:h-6 text-signal-amber animate-pulse" />
          <p className="text-sm md:text-xl text-umbral-light">&nbsp;</p>
        </div>
      </div>
    )
  }

  const text = t('ticker.daysSince', { days: String(days) })

  return (
    <div className={className}>
      <div className="bg-umbral-charcoal/80 backdrop-blur-sm border border-umbral-ash rounded-full px-6 py-3 inline-flex items-center gap-3">
        <Clock className="w-6 h-6 md:w-6 md:h-6 text-signal-amber animate-pulse" />
        <p className="text-sm md:text-xl text-umbral-light">
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
export function TickerSimple({ days: daysProp }: { days: number }) {
  const { locale } = useTranslation()
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(daysProp)
  }, [daysProp])
  
  const text = locale === 'es'
    ? `Han transcurrido`
    : `It has been`

  const textSuffix = locale === 'es'
    ? `días desde los hechos del 3 de enero de 2026`
    : `days since the events of January 3, 2026`

  return (
    <div className="bg-umbral-charcoal/80 backdrop-blur-sm border border-umbral-ash rounded-full px-6 py-3 inline-flex items-center gap-3">
      <Clock className="w-6 h-6 md:w-6 md:h-6 text-signal-amber animate-pulse" />
      <p className="text-sm md:text-lg text-umbral-light">
        {days !== null ? (
          <>
            {text}{' '}
            <span className="text-signal-teal font-bold font-mono">
              {days}
            </span>{' '}
            {textSuffix}
          </>
        ) : (
          <>&nbsp;</>
        )}
      </p>
    </div>
  )
}
