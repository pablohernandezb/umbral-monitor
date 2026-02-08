'use client'

import { Book, FileText, Newspaper, GraduationCap, ExternalLink, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReadingRoomItem } from '@/types'

interface ReadingCardProps {
  item: ReadingRoomItem
  className?: string
}

const typeIcons = {
  book: Book,
  article: GraduationCap,
  report: FileText,
  journalism: Newspaper,
}

const typeColors = {
  book: 'bg-signal-teal/10 text-signal-teal border-signal-teal/30',
  article: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
  report: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  journalism: 'bg-signal-red/10 text-signal-red border-signal-red/30',
}

export function ReadingCard({ item, className }: ReadingCardProps) {
  const Icon = typeIcons[item.type] || FileText
  
  const content = (
    <div
      className={cn(
        'card p-5 h-full flex flex-col',
        'hover:border-umbral-steel hover:bg-umbral-slate/30 transition-all',
        'group',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0',
            typeColors[item.type]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex items-center gap-2">
          {item.language === 'both' ? (
            <span className="badge bg-umbral-ash/50 text-umbral-light border border-umbral-steel text-xs">
              ES/EN
            </span>
          ) : (
            <span className="badge bg-umbral-ash/50 text-umbral-light border border-umbral-steel text-xs uppercase">
              {item.language}
            </span>
          )}
          {item.external_url && (
            <ExternalLink className="w-4 h-4 text-umbral-muted group-hover:text-signal-teal transition-colors" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-base font-semibold text-white leading-snug mb-1 group-hover:text-signal-teal transition-colors">
          {item.title}
        </h3>
        
        <p className="text-sm text-umbral-muted mb-2">
          {item.author} · {item.year}
        </p>
        
        <p className="text-sm text-umbral-muted leading-relaxed line-clamp-3">
          {item.description}
        </p>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-umbral-ash">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded bg-umbral-ash text-umbral-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  if (item.external_url) {
    return (
      <a
        href={item.external_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {content}
      </a>
    )
  }

  return content
}
