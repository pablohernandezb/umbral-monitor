'use client'

import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import type { ConnectivityStatus } from '@/types/ioda'

interface StatusBadgeProps {
  status: ConnectivityStatus
  className?: string
}

const STATUS_CONFIG: Record<ConnectivityStatus, {
  i18nKey: string
  dot: string
  badge: string
  pulse: boolean
}> = {
  normal: {
    i18nKey: 'ioda.status.normal',
    dot: 'bg-signal-teal',
    badge: 'border-signal-teal/30 bg-signal-teal/10 text-signal-teal',
    pulse: false,
  },
  degraded: {
    i18nKey: 'ioda.status.degraded',
    dot: 'bg-signal-amber',
    badge: 'border-signal-amber/30 bg-signal-amber/10 text-signal-amber',
    pulse: true,
  },
  outage: {
    i18nKey: 'ioda.status.outage',
    dot: 'bg-signal-red',
    badge: 'border-signal-red/30 bg-signal-red/10 text-signal-red',
    pulse: true,
  },
  'no-data': {
    i18nKey: 'ioda.status.noData',
    dot: 'bg-umbral-steel',
    badge: 'border-umbral-ash/50 bg-umbral-ash/20 text-umbral-muted',
    pulse: false,
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold uppercase tracking-wider transition-colors',
        cfg.badge,
        className
      )}
    >
      {/* Dot with optional pulse ring */}
      <span className="relative flex h-2 w-2 shrink-0">
        {cfg.pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              cfg.dot
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', cfg.dot)} />
      </span>
      {t(cfg.i18nKey)}
    </span>
  )
}
