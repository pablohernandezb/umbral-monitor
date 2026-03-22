// components/gaceta/BuscadorTab.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { ExternalLink } from 'lucide-react';
import type { GacetaRecord, GacetaChangeLabel } from '@/types';
import { LABEL_COLORS, gazetteUrl } from './gaceta-utils';
import { createGacetaTranslator } from './gaceta-i18n';

interface Props {
  records: GacetaRecord[];
}

const ALL_LABELS: GacetaChangeLabel[] = [
  'Designación', 'Jubilación', 'Traslado', 'Supresión',
  'Reorganización', 'Revocación', 'Ley', 'Autorización', 'Otro',
];

const PAGE_SIZE = 20;

export default function BuscadorTab({ records }: Props) {
  const { t, locale } = useTranslation();
  const tg = createGacetaTranslator(locale);
  const [search, setSearch] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [organismFilter, setOrganismFilter] = useState('');
  const [page, setPage] = useState(1);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, labelFilter, organismFilter]);

  const organisms = useMemo(() => {
    const set = new Set(records.map((r) => r.organism).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) => {
      if (labelFilter && r.change_label !== labelFilter) return false;
      if (organismFilter && r.organism !== organismFilter) return false;
      if (!q) return true;
      return (
        (r.person_name || '').toLowerCase().includes(q) ||
        (r.post_or_position || '').toLowerCase().includes(q) ||
        (r.organism || '').toLowerCase().includes(q) ||
        (r.summary || '').toLowerCase().includes(q)
      );
    });
  }, [records, search, labelFilter, organismFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      {/* Filters row */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder={t('gaceta.table.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] text-[11px] bg-white/5 border border-white/10 rounded px-3 py-1.5 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50"
        />
        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="text-[11px] bg-[#1a1a1c] border border-white/10 rounded px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-teal-500/50 [&>option]:bg-[#1a1a1c] [&>option]:text-zinc-300"
        >
          <option value="">{t('gaceta.table.allTypes')}</option>
          {ALL_LABELS.map((l) => (
            <option key={l} value={l}>{t(`gaceta.labels.${l}`)}</option>
          ))}
        </select>
        <select
          value={organismFilter}
          onChange={(e) => setOrganismFilter(e.target.value)}
          className="text-[11px] bg-[#1a1a1c] border border-white/10 rounded px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-teal-500/50 max-w-[220px] [&>option]:bg-[#1a1a1c] [&>option]:text-zinc-300"
        >
          <option value="">{t('gaceta.table.allOrganisms')}</option>
          {organisms.map((o) => (
            <option key={o} value={o}>{o.length > 40 ? o.slice(0, 40) + '…' : o}</option>
          ))}
        </select>
      </div>

      {/* Results table */}
      <div className="rounded-lg border border-white/5 bg-[#111113] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.date')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.gazette')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.type')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.person')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.position')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.organism')}</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-zinc-500">
                    {t('gaceta.table.noResults')}
                  </td>
                </tr>
              ) : (
                pageItems.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{r.gazette_date}</td>
                    <td className="px-3 py-2">
                      <a
                        href={gazetteUrl(r.gazette_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-teal-400 hover:underline"
                      >
                        #{r.gazette_number}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          background: `${LABEL_COLORS[r.change_label] || '#555'}22`,
                          color: LABEL_COLORS[r.change_label] || '#999',
                        }}
                      >
                        {t(`gaceta.labels.${r.change_label}`)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-200">
                      <div className="flex items-center gap-1.5">
                        <span className="max-w-[120px] truncate">{r.person_name || '—'}</span>
                        {r.is_military_person && (
                          <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-[#EF9F27]/20 text-[#EF9F27] uppercase flex-shrink-0">
                            {locale === 'es' ? 'MILITAR' : 'MILITARY'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-zinc-400 max-w-[140px] truncate">{tg('post_or_position', r.post_or_position) || '—'}</td>
                    <td className="px-3 py-2 text-zinc-400 max-w-[160px] truncate">{tg('organism', r.organism) || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>{filtered.length} {locale === 'es' ? 'resultados' : 'results'}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-teal-500/50 hover:text-teal-300 transition-colors"
          >
            ←
          </button>
          <span>
            {t('gaceta.table.page')} {page} {t('gaceta.table.of')} {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border border-white/10 disabled:opacity-30 hover:border-teal-500/50 hover:text-teal-300 transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
