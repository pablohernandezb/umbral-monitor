'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchCheck, Pause, Play, ExternalLink } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { getFactCheckTweets } from '@/lib/data'
import type { FactCheckTweet } from '@/types'

function TweetCard({ tweet, locale, t }: { tweet: FactCheckTweet; locale: string; t: (key: string) => string }) {
  const text = locale === 'es' ? tweet.text_es : (tweet.text_en || tweet.text_es)
  const hasAlert = tweet.alert_tags.length > 0

  return (
    <div className={cn(
      'w-[300px] md:w-[340px] flex-shrink-0 rounded-lg p-4 flex flex-col gap-3 transition-colors',
      hasAlert
        ? 'bg-signal-red/5 border-2 border-signal-red/40 animate-pulse-border shadow-[0_0_15px_rgba(220,38,38,0.15)]'
        : 'bg-umbral-charcoal/60 border border-umbral-ash hover:border-umbral-steel'
    )}>
      {/* Alert badge */}
      {hasAlert && (
        <div className="flex gap-1.5">
          {tweet.alert_tags.map(tag => (
            <span key={tag} className="text-[10px] font-mono font-bold text-signal-red bg-signal-red/10 border border-signal-red/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Header: avatar + handle + time */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-umbral-ash/80 border border-umbral-steel overflow-hidden flex-shrink-0">
          <img
            src={tweet.profile_image_url}
            alt={tweet.display_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${tweet.display_name.charAt(0)}&background=1a1a2e&color=14b8a6&size=32`
            }}
          />
        </div>
        <a
          href={`https://x.com/${tweet.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-signal-teal text-sm font-medium hover:underline truncate"
        >
          @{tweet.username}
        </a>
        <span className="text-umbral-muted text-xs font-mono ml-auto flex-shrink-0">
          {formatRelativeTime(tweet.published_at, locale)}
        </span>
      </div>

      {/* Tweet text */}
      <p className="text-white text-sm leading-relaxed line-clamp-3 flex-1">
        {text}
      </p>

      {/* Footer: live dot + VIEW link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', hasAlert ? 'bg-signal-red' : 'bg-signal-teal')} />
          <span className="text-[10px] text-umbral-muted uppercase tracking-wider">{t('factCheckingFeed.live')}</span>
        </div>
        <a
          href={tweet.tweet_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-signal-teal text-xs font-medium hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {t('factCheckingFeed.view')}
        </a>
      </div>
    </div>
  )
}

export function FactCheckingFeed() {
  const { t, locale } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [tweets, setTweets] = useState<FactCheckTweet[]>([])
  const [currentTime, setCurrentTime] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Defer rendering until after hydration to avoid mismatches
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch tweets from data layer on mount
  useEffect(() => {
    if (!mounted) return
    getFactCheckTweets(15).then(({ data }) => {
      if (data) setTweets(data)
    })
  }, [mounted])

  // Update clock every second
  useEffect(() => {
    if (!mounted) return
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'UTC',
        }) + 'Z'
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [mounted])

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  const shouldPause = isPaused || isHovered

  const statusText = isPaused ? t('factCheckingFeed.paused') : isHovered ? t('factCheckingFeed.hoverPaused') : t('factCheckingFeed.autoScroll')
  const dotColor = isPaused
    ? 'bg-signal-red'
    : isHovered
    ? 'bg-signal-amber'
    : 'bg-signal-teal'

  const accountCount = new Set(tweets.map(tw => tw.username)).size || 3
  const totalReports = tweets.length
  const totalAlerts = tweets.filter(tw => tw.alert_tags.length > 0).length

  if (!mounted || tweets.length === 0) {
    return (
      <div className="mt-10 rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden h-[200px] animate-pulse" />
    )
  }

  return (
    <div className="mt-10 rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SearchCheck className="w-5 h-5 text-signal-teal" />
          <h3 className="text-white font-bold font-mono text-sm tracking-wider uppercase">
            {t('factCheckingFeed.title')}
          </h3>
          <div className={cn('w-2 h-2 rounded-full animate-pulse', dotColor)} />
          <span className="text-umbral-muted font-mono text-xs hidden sm:inline">
            {currentTime}
          </span>
        </div>

        {/* Auto-scroll toggle */}
        <button
          onClick={handleTogglePause}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors',
            isPaused
              ? 'border-signal-red/30 bg-signal-red/10 text-signal-red hover:bg-signal-red/20'
              : isHovered
              ? 'border-signal-amber/30 bg-signal-amber/10 text-signal-amber'
              : 'border-signal-teal/30 bg-signal-teal/10 text-signal-teal hover:bg-signal-teal/20'
          )}
        >
          {isPaused ? (
            <Play className="w-3 h-3" />
          ) : (
            <Pause className="w-3 h-3" />
          )}
          {statusText}
        </button>
      </div>

      {/* Monitoring info */}
      <div className="px-4 md:px-6 py-2 border-b border-umbral-ash/30 flex items-center justify-between">
        <span className="text-umbral-muted text-xs font-mono uppercase tracking-wider">
          {t('factCheckingFeed.monitoring').replace('{count}', String(accountCount))}
        </span>
        <span className="text-umbral-muted text-xs font-mono">
          {totalReports} {t('factCheckingFeed.reports')} &middot; {totalAlerts} {t('factCheckingFeed.alerts')}
        </span>
      </div>

      {/* Scrolling feed */}
      <div
        className="overflow-hidden py-4 px-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={scrollRef}
          className={cn(
            'flex gap-4 w-max',
            shouldPause ? 'animate-none' : 'animate-scroll-left'
          )}
          style={{
            animationPlayState: shouldPause ? 'paused' : 'running',
          }}
        >
          {/* Render tweets twice for infinite scroll loop */}
          {[...tweets, ...tweets].map((tweet, index) => (
            <TweetCard key={`${tweet.id}-${index}`} tweet={tweet} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </div>
  )
}
