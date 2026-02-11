'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Filter, 
  Search, 
  X,
  Book,
  FileText,
  Newspaper,
  GraduationCap,
  Globe,
  Calendar,
  ArrowUpDown
} from 'lucide-react'
import { useTranslation } from '@/i18n'
import { ReadingCard } from '@/components/ui/ReadingCard'
import { getReadingRoomItems } from '@/lib/data'
import { cn } from '@/lib/utils'
import type { ReadingRoomItem } from '@/types'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

// Filter type icons
const typeIcons = {
  all: Filter,
  book: Book,
  article: GraduationCap,
  report: FileText,
  journalism: Newspaper,
}

// Type colors for active filters
const typeColors = {
  book: 'bg-signal-teal/10 text-signal-teal border-signal-teal/30',
  article: 'bg-signal-blue/10 text-signal-blue border-signal-blue/30',
  report: 'bg-signal-amber/10 text-signal-amber border-signal-amber/30',
  journalism: 'bg-signal-red/10 text-signal-red border-signal-red/30',
}

export default function ReadingRoomPage() {
  const { t, locale } = useTranslation()
  
  const [items, setItems] = useState<ReadingRoomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const res = await getReadingRoomItems()
        if (res.data) setItems(res.data)
      } catch (error) {
        console.error('Failed to load reading room items:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items]

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => item.type === typeFilter)
    }

    // Language filter
    if (languageFilter !== 'all') {
      result = result.filter(item => 
        item.language === languageFilter || item.language === 'both'
      )
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.title_en.toLowerCase().includes(query) ||
        (item.title_es && item.title_es.toLowerCase().includes(query)) ||
        item.author.toLowerCase().includes(query) ||
        item.description_en.toLowerCase().includes(query) ||
        (item.description_es && item.description_es.toLowerCase().includes(query)) ||
        item.tags_en.some(tag => tag.toLowerCase().includes(query)) ||
        (item.tags_es && item.tags_es.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'year') {
        return sortOrder === 'desc' ? b.year - a.year : a.year - b.year
      } else {
        const comparison = a.title_en.localeCompare(b.title_en)
        return sortOrder === 'desc' ? -comparison : comparison
      }
    })

    return result
  }, [items, typeFilter, languageFilter, searchQuery, sortBy, sortOrder])

  // Get unique years for display
  const years = useMemo(() => {
    return [...new Set(items.map(item => item.year))].sort((a, b) => b - a)
  }, [items])

  // Count by type
  const countByType = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    items.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1
    })
    return counts
  }, [items])

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setLanguageFilter('all')
    setSortBy('year')
    setSortOrder('desc')
  }

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || languageFilter !== 'all'

  return (
    <div className="relative min-h-screen">
      {/* Hero section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-signal-blue/5 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal-blue/10 border border-signal-blue/30 text-signal-blue text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              {locale === 'es' ? 'Archivo curado' : 'Curated archive'}
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
              {t('readingRoom.title')}
            </h1>
            <p className="text-lg text-umbral-muted max-w-2xl mx-auto">
              {t('readingRoom.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters section */}
      <section className="sticky top-16 z-40 bg-umbral-black/90 backdrop-blur-md border-b border-umbral-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-umbral-muted" />
              <input
                type="text"
                placeholder={locale === 'es' ? 'Buscar por título, autor o tema...' : 'Search by title, author, or topic...'}
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

            {/* Type filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {(['all', 'book', 'article', 'report', 'journalism'] as const).map((type) => {
                const Icon = typeIcons[type]
                const isActive = typeFilter === type
                const count = countByType[type] || 0
                
                return (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
                      isActive
                        ? type === 'all' 
                          ? 'bg-signal-teal/10 text-signal-teal border-signal-teal/30'
                          : typeColors[type]
                        : 'bg-umbral-ash/50 text-umbral-light border-umbral-steel hover:bg-umbral-ash'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>
                      {type === 'all' 
                        ? t('readingRoom.filters.all')
                        : t(`readingRoom.filters.${type}s`)
                      }
                    </span>
                    <span className="text-xs opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Language filter */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-umbral-muted" />
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="bg-umbral-charcoal border border-umbral-ash rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-signal-teal"
              >
                <option value="all">{t('readingRoom.filters.all')}</option>
                <option value="es">{t('readingRoom.spanish')}</option>
                <option value="en">{t('readingRoom.english')}</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (sortBy === 'year') {
                    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
                  } else {
                    setSortBy('year')
                    setSortOrder('desc')
                  }
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors',
                  sortBy === 'year'
                    ? 'bg-signal-teal/10 text-signal-teal border-signal-teal/30'
                    : 'bg-umbral-ash/50 text-umbral-light border-umbral-steel hover:bg-umbral-ash'
                )}
              >
                <Calendar className="w-4 h-4" />
                {t('readingRoom.year')}
                {sortBy === 'year' && (
                  <ArrowUpDown className={cn('w-3 h-3', sortOrder === 'asc' && 'rotate-180')} />
                )}
              </button>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-signal-teal hover:underline"
              >
                {locale === 'es' ? 'Limpiar filtros' : 'Clear filters'}
              </button>
            )}
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
              {locale === 'es' 
                ? `${filteredItems.length} ${filteredItems.length === 1 ? 'resultado' : 'resultados'}`
                : `${filteredItems.length} ${filteredItems.length === 1 ? 'result' : 'results'}`
              }
              {hasActiveFilters && (
                <span>
                  {' '}({locale === 'es' ? 'filtrado' : 'filtered'})
                </span>
              )}
            </p>
          </motion.div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-umbral-ash" />
                    <div className="w-12 h-5 bg-umbral-ash rounded" />
                  </div>
                  <div className="h-5 bg-umbral-ash rounded w-3/4 mb-2" />
                  <div className="h-4 bg-umbral-ash rounded w-1/2 mb-3" />
                  <div className="h-16 bg-umbral-ash rounded mb-4" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-umbral-ash rounded" />
                    <div className="h-5 w-16 bg-umbral-ash rounded" />
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
              <BookOpen className="w-16 h-16 text-umbral-steel mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {locale === 'es' ? 'No se encontraron resultados' : 'No results found'}
              </h3>
              <p className="text-umbral-muted mb-6">
                {locale === 'es' 
                  ? 'Intenta ajustar los filtros o la búsqueda'
                  : 'Try adjusting your filters or search'
                }
              </p>
              <button
                onClick={clearFilters}
                className="btn btn-secondary"
              >
                {locale === 'es' ? 'Limpiar filtros' : 'Clear filters'}
              </button>
            </motion.div>
          ) : (
            /* Results grid */
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                    <ReadingCard item={item} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Contribution CTA */}
      <section className="section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-6 md:p-10 border-signal-blue/20 text-center"
          >
            <BookOpen className="w-12 h-12 text-signal-blue mx-auto mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
              {locale === 'es' 
                ? '¿Conoces una fuente que deberíamos incluir?'
                : 'Know a source we should include?'
              }
            </h3>
            <p className="text-umbral-muted mb-6 max-w-xl mx-auto">
              {locale === 'es'
                ? 'Estamos siempre buscando expandir nuestro archivo con recursos de calidad sobre Venezuela, democracia, autoritarismo y transiciones de régimen.'
                : "We're always looking to expand our archive with quality resources on Venezuela, democracy, authoritarianism, and regime transitions."
              }
            </p>
            <a
              href="mailto:hi@pablohernandezb.dev?subject=Suggestion for Reading Room"
              className="btn btn-primary"
            >
              {locale === 'es' ? 'Sugerir un recurso' : 'Suggest a resource'}
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
