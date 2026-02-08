'use client'

import { ExternalLink, Clock, Zap } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { NewsItem } from '@/types'

interface NewsCardProps {
  item: NewsItem
  compact?: boolean
  className?: string
}

const categoryColors: Record<string, string> = {
  political: 'bg-signal-red/10 text-signal-red border-signal-red/30',
  economic: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  social: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
  international: 'bg-signal-teal/10 text-signal-teal border-signal-teal/30',
}

export function NewsCard({ item, compact = false, className }: NewsCardProps) {
  const { t } = useTranslation()

  if (compact) {
    return (
      <a
        href={item.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'block p-3 rounded-lg bg-umbral-slate/30 border border-umbral-ash',
          'hover:border-umbral-steel hover:bg-umbral-slate/50 transition-all',
          'group',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {item.is_breaking && (
            <span className="flex-shrink-0 mt-1">
              <Zap className="w-4 h-4 text-signal-red animate-pulse" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium leading-snug line-clamp-2 group-hover:text-signal-teal transition-colors">
              {item.headline}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-umbral-muted">{item.source}</span>
              <span className="text-umbral-steel">·</span>
              <span className="text-xs text-umbral-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(item.published_at)}
              </span>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-umbral-muted group-hover:text-signal-teal flex-shrink-0 transition-colors" />
        </div>
      </a>
    )
  }

  return (
    <a
      href={item.external_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block card p-4 hover:border-umbral-steel hover:bg-umbral-slate/30 transition-all group',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {item.is_breaking && (
            <span className="badge badge-breaking flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {t('landing.news.breakingNews')}
            </span>
          )}
          <span className={cn('badge border', categoryColors[item.category])}>
            {item.category}
          </span>
        </div>
        <ExternalLink className="w-4 h-4 text-umbral-muted group-hover:text-signal-teal flex-shrink-0 transition-colors" />
      </div>

      <h3 className="text-base font-semibold text-white leading-snug mb-2 group-hover:text-signal-teal transition-colors">
        {item.headline}
      </h3>

      {item.summary && (
        <p className="text-sm text-umbral-muted leading-relaxed mb-3 line-clamp-2">
          {item.summary}
        </p>
      )}

      <div className="flex items-center gap-3 text-xs text-umbral-muted">
        <span className="font-medium">{item.source}</span>
        <span className="text-umbral-steel">·</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(item.published_at)}
        </span>
      </div>
    </a>
  )
}
