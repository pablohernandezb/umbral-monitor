// components/blocking/BlockingDashboard.tsx
'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { ShieldOff, ExternalLink } from 'lucide-react';
import { BlockedDomain } from '@/types';
import {
  PROVIDERS,
  BLOCK_TYPES,
  getProviderValue,
  normalizeBlockTypes,
  computeMetrics,
} from './blocking-utils';
import ProviderBarChart from './ProviderBarChart';
import CategoryDonut from './CategoryDonut';
import BlockTypeDonut from './BlockTypeDonut';
import BlockingCarousel from './BlockingCarousel';

interface Filters {
  provider: string | null;
  blockType: string | null;
  category: string | null;
}

export default function BlockingDashboard({
  data,
}: {
  data: BlockedDomain[];
}) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<Filters>({
    provider: null,
    blockType: null,
    category: null,
  });

  // Cross-filtered data for the carousel
  const filteredData = useMemo(() => {
    let result = data;

    if (filters.category)
      result = result.filter((d) => d.category === filters.category);

    if (filters.provider)
      result = result.filter((d) => {
        const key = filters.provider!.toLowerCase().replace('-', '_') as keyof BlockedDomain;
        return (d[key] as string) !== 'ok';
      });

    if (filters.blockType) {
      if (filters.blockType === 'ok') {
        result = result.filter((d) =>
          PROVIDERS.every((p) => getProviderValue(d as any, p) === 'ok')
        );
      } else {
        result = result.filter((d) =>
          PROVIDERS.some((p) =>
            normalizeBlockTypes(getProviderValue(d as any, p)).includes(
              filters.blockType!
            )
          )
        );
      }
    }

    return result;
  }, [data, filters]);

  const metrics = useMemo(() => computeMetrics(data as any[]), [data]);

  // Most recent upload timestamp from the dataset
  const lastUpdated = useMemo(() => {
    if (data.length === 0) return null;
    const ts = data.reduce((latest, d) => {
      const t = d.uploaded_at ?? '';
      return t > latest ? t : latest;
    }, '');
    return ts ? new Date(ts) : null;
  }, [data]);

  const toggleFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const clearFilters = () => setFilters({ provider: null, blockType: null, category: null });

  const activeFilters: string[] = [];
  if (filters.category) activeFilters.push(filters.category);
  if (filters.provider) activeFilters.push(filters.provider);
  if (filters.blockType)
    activeFilters.push(
      filters.blockType === 'ok'
        ? t('blocking.accessible')
        : filters.blockType
    );

  return (
    <div className="rounded-lg border border-umbral-ash bg-umbral-black/90 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 md:px-6 py-3 border-b border-umbral-ash/50 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldOff className="w-4 h-4 text-signal-teal" />
          <div>
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              {t('blocking.title')}
            </h3>
            <p className="text-[10px] text-umbral-muted mt-0.5">
              {t('blocking.subtitle')}
            </p>
          </div>
        </div>

        <a
          href="https://bloqueos.vesinfiltro.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-signal-teal hover:underline shrink-0"
        >
          <ExternalLink className="w-3 h-3" />
          VE Sin Filtro
        </a>
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-6 space-y-4">

      {/* Two-column layout: left = metrics+chart+donuts, right = carousel full height */}
      {/* relative wrapper so the right column can be absolutely positioned */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">

        {/* LEFT: metrics + bar chart + donuts — determines the row height */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard value={metrics.totalDomains} label={t('blocking.domainsTestedLabel')} />
            <MetricCard value={metrics.blockedDomains} label={t('blocking.blockedLabel')} />
            <MetricCard value={`${metrics.blockingRate}%`} label={t('blocking.blockingRateLabel')} highlight />
            <MetricCard value={metrics.providerCount} label={t('blocking.providersLabel')} />
          </div>

          <ProviderBarChart
            data={data as any[]}
            activeProvider={filters.provider}
            activeBlockType={filters.blockType}
            activeCategory={filters.category}
            onProviderClick={(p) => toggleFilter('provider', p)}
            onBlockTypeClick={(bt) => toggleFilter('blockType', bt)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ height: '360px' }}>
            <CategoryDonut
              data={data as any[]}
              activeCategory={filters.category}
              onCategoryClick={(c) => toggleFilter('category', c)}
            />
            <BlockTypeDonut
              data={data as any[]}
              activeBlockType={filters.blockType}
              activeCategory={filters.category}
              onBlockTypeClick={(bt) => toggleFilter('blockType', bt)}
            />
          </div>
        </div>

        {/* RIGHT: carousel — absolutely positioned to match left column height exactly */}
        <div className="hidden lg:block absolute top-0 bottom-0 right-0" style={{ width: 'calc(33.333% - 6px)' }}>
          <BlockingCarousel
            data={filteredData as any[]}
            filterLabel={
              activeFilters.length > 0
                ? `${t('blocking.filtered')}: ${activeFilters.join(' + ')} (${filteredData.length})`
                : `${t('blocking.showingAll', { count: filteredData.length })}`
            }
            hasFilters={activeFilters.length > 0}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Mobile-only carousel (normal flow) */}
        <div className="lg:hidden">
          <BlockingCarousel
            data={filteredData as any[]}
            filterLabel={
              activeFilters.length > 0
                ? `${t('blocking.filtered')}: ${activeFilters.join(' + ')} (${filteredData.length})`
                : `${t('blocking.showingAll', { count: filteredData.length })}`
            }
            hasFilters={activeFilters.length > 0}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      </div>{/* end content */}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-[10px] font-mono text-umbral-muted px-4 md:px-6 py-3 border-t border-umbral-ash/30">
        <span>{t('common.source')}: VE Sin Filtro / OONI</span>
        <span>
          {lastUpdated
            ? `${t('common.lastUpdated')}: ${lastUpdated.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}`
            : '—'}
        </span>
      </div>

    </div>
  );
}

function MetricCard({
  value,
  label,
  highlight = false,
}: {
  value: string | number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#111113] p-3 text-center">
      <div
        className={`font-display text-xl font-medium ${
          highlight ? 'text-red-500' : 'text-teal-400'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
