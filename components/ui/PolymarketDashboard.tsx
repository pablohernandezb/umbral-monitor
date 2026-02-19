'use client'

import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Eye } from 'lucide-react'
import { useTranslation } from '@/i18n'

const MARKETS = [
  {
    // Binary market: "Will Trump meet with Delcy Rodríguez by March 31?" — replaces the
    // multi-outcome event "venezuela-leader-end-of-2026" which the embed API doesn't support
    slug: 'will-trump-meet-with-delcy-rodrguez-by-march-31',
    key: 'trumpMeetsDelcy',
  },
  {
    slug: 'will-mara-corina-machado-enter-venezuela-by-march-31-426-698',
    key: 'mcmEnters',
  },
  {
    slug: 'will-delcy-rodrguez-be-the-leader-of-venezuela-end-of-2026',
    key: 'delcyLeader',
  },
  {
    slug: 'will-the-us-embassy-in-venezuela-reopen-by-march-31',
    key: 'embassyReopens',
  },
]

function MarketEmbed({ slug, title }: { slug: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.floor(entry.contentRect.width))
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const embedUrl = width > 0
    ? `https://embed.polymarket.com/market.html?market=${slug}&theme=dark&features=volume,chart,filters&width=${width}`
    : null

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] bg-umbral-charcoal border border-umbral-ash rounded-lg overflow-hidden flex flex-col"
    >
      <div className="px-3 py-2 border-b border-umbral-ash/50 flex items-center justify-between shrink-0">
        <p className="text-xs text-white font-medium leading-snug line-clamp-1">{title}</p>
        <a
          href={`https://polymarket.com/event/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-umbral-muted hover:text-signal-teal transition-colors shrink-0"
          aria-label="Open on Polymarket"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      {embedUrl && (
        <iframe
          src={embedUrl}
          title={title}
          style={{
            flex: 1,
            width: '100%',
            minHeight: 0,
            border: 'none',
            display: 'block',
          }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  )
}

export function PolymarketDashboard() {
  const { t, locale } = useTranslation()

  return (
    <div className="rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-signal-teal animate-pulse" />
          <div>
            <h3 className="text-base font-semibold text-white font-mono uppercase tracking-wider">
              {t('polymarket.title')}
            </h3>
          </div>
        </div>
        <a
          href="https://polymarket.com/predictions/venezuela"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] font-mono text-signal-teal hover:underline shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          {locale === 'es' ? 'Ver todos' : 'View all'}
        </a>
      </div>

      {/* Markets grid */}
      <div className="p-4 md:p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MARKETS.map((market) => (
            <MarketEmbed
              key={market.slug}
              slug={market.slug}
              title={t(`polymarket.markets.${market.key}`)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-umbral-ash/30 flex items-center justify-between text-[10px] text-umbral-muted">
          <span>{t('polymarket.source')}</span>
          <span className="font-mono">{t('polymarket.disclaimer')}</span>
        </div>
      </div>
    </div>
  )
}
