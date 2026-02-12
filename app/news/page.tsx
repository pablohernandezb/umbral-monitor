'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Newspaper,
  Search,
  X,
  Filter,
  Landmark,
  TrendingUp,
  Users,
  Globe,
  Calendar,
  ArrowUpDown,
  Clock,
} from 'lucide-react'
import { useTranslation } from '@/i18n'
import { NewsCard } from '@/components/ui/NewsCard'
import { getNewsFeed } from '@/lib/data'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { NewsItem } from '@/types'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

// Category filter config
const categoryIcons = {
  all: Filter,
  political: Landmark,
  economic: TrendingUp,
  social: Users,
  international: Globe,
}

const categoryColors: Record<string, string> = {
  political: 'bg-signal-red/10 text-signal-red border-signal-red/30',
  economic: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  social: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
  international: 'bg-signal-teal/10 text-signal-teal border-signal-teal/30',
}

export default function NewsRoomPage() {
  const { t, locale } = useTranslation()

  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await getNewsFeed(500)
        if (res.data) setItems(res.data)
      } catch (error) {
        console.error('Failed to load news:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Get unique sources
  const sources = useMemo(() => {
    return [...new Set(items.map(item => item.source))].sort()
  }, [items])

  // Count by category
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    items.forEach(item => {
      counts[item.category_en] = (counts[item.category_en] || 0) + 1
    })
    return counts
  }, [items])

  // Filter and sort
  const filteredItems = useMemo(() => {
    let result = [...items]

    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category_en === categoryFilter)
    }

    if (sourceFilter !== 'all') {
      result = result.filter(item => item.source === sourceFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.headline_en.toLowerCase().includes(query) ||
        item.headline_es.toLowerCase().includes(query) ||
        (item.summary_en && item.summary_en.toLowerCase().includes(query)) ||
        (item.summary_es && item.summary_es.toLowerCase().includes(query)) ||
        item.source.toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime()
      const dateB = new Date(b.published_at).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [items, categoryFilter, sourceFilter, searchQuery, sortOrder])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setCategoryFilter('all')
    setSourceFilter('all')
    setSortOrder('desc')
  }, [])

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || sourceFilter !== 'all'

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, Record<string, string>> = {
      political: { en: 'Political', es: 'Política' },
      economic: { en: 'Economic', es: 'Economía' },
      social: { en: 'Social', es: 'Social' },
      international: { en: 'International', es: 'Internacional' },
    }
    return labels[cat]?.[locale] || cat
  }

  return (
    <div className="relative min-h-screen">
      {/* Hero section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-signal-teal/5 via-transparent to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-teal/10 border border-signal-teal/30 text-signal-teal text-sm font-medium mb-6">
              <Newspaper className="w-4 h-4" />
              {t('newsRoom.badge')}
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              {t('newsRoom.title')}
            </h1>
            <p className="text-lg text-umbral-muted max-w-2xl mx-auto">
              {t('newsRoom.subtitle')}
            </p>

            {/* Stats bar */}
            {!loading && (
              <div className="flex items-center justify-center gap-6 mt-8">
                <div className="flex items-center gap-2 text-sm text-umbral-muted">
                  <Newspaper className="w-4 h-4 text-signal-teal" />
                  <span className="text-white font-bold">{items.length}</span>
                  {t('newsRoom.articles')}
                </div>
                <div className="w-px h-4 bg-umbral-ash" />
                <div className="flex items-center gap-2 text-sm text-umbral-muted">
                  <Globe className="w-4 h-4 text-signal-teal" />
                  <span className="text-white font-bold">{sources.length}</span>
                  {t('newsRoom.sources')}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Filters section */}
      <section className="sticky top-16 z-40 bg-umbral-black/90 backdrop-blur-md border-b border-umbral-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          {/* Row 1: Search + source + sort + clear */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-umbral-muted" />
              <input
                type="text"
                placeholder={t('newsRoom.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-umbral-charcoal border border-umbral-ash rounded-lg text-white placeholder-umbral-muted focus:outline-none focus:border-signal-teal transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-umbral-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-umbral-muted" />
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-umbral-charcoal border border-umbral-ash rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-signal-teal"
              >
                <option value="all">{t('newsRoom.allSources')}</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors bg-signal-teal/10 text-signal-teal border-signal-teal/30"
            >
              <Calendar className="w-4 h-4" />
              {t('newsRoom.date')}
              <ArrowUpDown className={cn('w-3 h-3', sortOrder === 'asc' && 'rotate-180')} />
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-signal-teal hover:underline"
              >
                {t('newsRoom.clearFilters')}
              </button>
            )}
          </div>

          {/* Row 2: Category filters */}
          <div className="flex items-center justify-center gap-2">
            {(['all', 'political', 'economic', 'social', 'international'] as const).map((cat) => {
              const Icon = categoryIcons[cat]
              const isActive = categoryFilter === cat
              const count = countByCategory[cat] || 0

              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                    isActive
                      ? cat === 'all'
                        ? 'bg-signal-teal/10 text-signal-teal border-signal-teal/30'
                        : categoryColors[cat]
                      : 'bg-umbral-ash/50 text-umbral-light border-umbral-steel hover:bg-umbral-ash'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>
                    {cat === 'all'
                      ? t('newsRoom.filters.all')
                      : getCategoryLabel(cat)}
                  </span>
                  <span className="text-xs opacity-60">({count})</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <p className="text-sm text-umbral-muted">
              {filteredItems.length} {filteredItems.length === 1 ? t('newsRoom.result') : t('newsRoom.results')}
              {hasActiveFilters && (
                <span> ({t('newsRoom.filtered')})</span>
              )}
            </p>
          </motion.div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-20 h-5 bg-umbral-ash rounded" />
                    <div className="w-4 h-4 bg-umbral-ash rounded" />
                  </div>
                  <div className="h-5 bg-umbral-ash rounded w-3/4 mb-2" />
                  <div className="h-4 bg-umbral-ash rounded w-full mb-2" />
                  <div className="h-4 bg-umbral-ash rounded w-1/2 mb-3" />
                  <div className="flex gap-3">
                    <div className="h-4 w-20 bg-umbral-ash rounded" />
                    <div className="h-4 w-16 bg-umbral-ash rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Newspaper className="w-16 h-16 text-umbral-steel mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('newsRoom.noResults')}
              </h3>
              <p className="text-umbral-muted mb-6">
                {t('newsRoom.noResultsHint')}
              </p>
              <button
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                {t('newsRoom.clearFilters')}
              </button>
            </motion.div>
          ) : (
            /* Results grid */
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={fadeInUp}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NewsCard item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
