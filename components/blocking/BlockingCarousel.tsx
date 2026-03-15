// components/blocking/BlockingCarousel.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n';
import {
  PROVIDERS,
  CATEGORY_COLORS,
  getProviderValue,
} from './blocking-utils';

interface Props {
  data: Record<string, string>[];
  filterLabel: string;
  hasFilters: boolean;
  onClearFilters: () => void;
}

function statusColorClass(value: string): string {
  if (value === 'ok') return 'text-green-500';
  if (value.includes('DNS') && value.includes('+')) return 'text-pink-400';
  if (value.includes('TCP') && value.includes('HTTP')) return 'text-pink-400';
  if (value.includes('DNS')) return 'text-blue-400';
  if (value.includes('TCP')) return 'text-red-400';
  if (value.includes('HTTP')) return 'text-amber-400';
  return 'text-blue-400';
}

function DomainCard({ d, t }: { d: Record<string, string>; t: (k: string) => string }) {
  return (
    <div className="rounded-md border border-white/5 bg-[#0a0a0b] p-2.5 hover:border-teal-500/30 transition-colors relative flex-shrink-0 w-full">
      {/* View page button */}
      <a
        href={`https://${d.domain}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-teal-400 transition-colors border border-white/5 hover:border-teal-500/30 rounded px-1.5 py-0.5"
      >
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {t('blocking.viewPage')}
      </a>

      {/* Site name */}
      <div className="font-display text-[13px] font-medium text-zinc-200 pr-20">
        {d.site}
      </div>

      {/* Domain */}
      <div className="font-mono text-[11px] text-teal-400 mt-0.5 mb-2 break-all">
        {d.domain}
      </div>

      {/* Category pill */}
      <span
        className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mb-2"
        style={{
          background: `${CATEGORY_COLORS[d.category] || '#555'}22`,
          color: CATEGORY_COLORS[d.category] || '#999',
        }}
      >
        {t(`blocking.cat.${d.category}`)}
      </span>

      {/* Provider grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
        {PROVIDERS.map((p) => {
          const val = getProviderValue(d, p);
          return (
            <div key={p} className="flex justify-between px-1 py-0.5 rounded">
              <span className="text-zinc-500">{p}</span>
              <span className={`font-medium ${statusColorClass(val)}`}>{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BlockingCarousel({ data, filterLabel, hasFilters, onClearFilters }: Props) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3 flex flex-col h-full">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400">
            {t('blocking.details')}
          </h3>
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="px-2.5 py-0.5 rounded-full font-display text-[10px] font-medium tracking-wide border border-zinc-600/50 text-zinc-400 hover:border-teal-500/50 hover:text-teal-300 hover:bg-teal-500/10 transition-all"
            >
              {t('blocking.clearFilters')}
            </button>
          )}
        </div>
        <p className="text-[11px] text-zinc-500 mb-3">{filterLabel}</p>
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          No domains match current filters
        </div>
      </div>
    );
  }

  // Duplicate for seamless infinite loop (same as FactCheckingFeed)
  const doubled = [...data, ...data];
  // 2s per card matches FactCheckingFeed's effective scroll speed (60s / 30 cards)
  const duration = data.length * 2;

  return (
    <div className="rounded-lg border border-white/5 bg-[#111113] p-3 flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between mb-1 flex-shrink-0">
        <h3 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400">
          {t('blocking.details')}
        </h3>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            title="Clear filters"
            className="px-2.5 py-0.5 rounded-full font-display text-[10px] font-medium tracking-wide border border-zinc-700 text-zinc-400 hover:border-teal-500/50 hover:text-teal-300 hover:bg-teal-500/10 transition-all"
          >
            {t('blocking.clearFilters')}
          </button>
        )}
      </div>
      <p className="text-[11px] text-zinc-500 mb-3 min-h-[16px] flex-shrink-0">
        {filterLabel}
      </p>

      {/* Scrolling feed — overflow hidden so cards disappear at edges */}
      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#111113] to-transparent z-10 pointer-events-none" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#111113] to-transparent z-10 pointer-events-none" />

        <div
          className="flex flex-col gap-2"
          style={{
            animationName: 'scrollUp',
            animationDuration: `${duration}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationPlayState: isHovered ? 'paused' : 'running',
          }}
        >
          {doubled.map((d, i) => (
            <DomainCard key={`${d.domain}-${i}`} d={d} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
