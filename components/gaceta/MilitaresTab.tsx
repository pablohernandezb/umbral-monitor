// components/gaceta/MilitaresTab.tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/i18n';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { GacetaRecord } from '@/types';

interface Props {
  records: GacetaRecord[];
}

export default function MilitaresTab({ records }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const military = useMemo(
    () => records.filter((r) => r.is_military_person),
    [records]
  );

  const civilian = records.length - military.length;

  const militaryPct = records.length > 0
    ? Math.round((military.length / records.length) * 100)
    : 0;

  const ministryData = useMemo(() => {
    const counts: Record<string, number> = {};
    military.forEach((r) => {
      if (!r.organism) return;
      const short = r.organism.length > 30 ? r.organism.slice(0, 30) + '…' : r.organism;
      counts[short] = (counts[short] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [military]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return military.filter((r) =>
      !q ||
      (r.person_name || '').toLowerCase().includes(q) ||
      (r.post_or_position || '').toLowerCase().includes(q) ||
      (r.organism || '').toLowerCase().includes(q)
    );
  }, [military, search]);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#EF9F27]/30 bg-[#EF9F27]/5 p-3 text-center">
          <div className="font-display text-xl font-medium text-[#EF9F27]">{military.length}</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.kpi.militaryPersons')}</div>
        </div>
        <div className="rounded-lg border border-[#EF9F27]/30 bg-[#EF9F27]/5 p-3 text-center">
          <div className="font-display text-xl font-medium text-[#EF9F27]">{militaryPct}%</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.kpi.militaryPct')}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 text-center">
          <div className="font-display text-xl font-medium text-teal-400">{records.length}</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.kpi.totalChanges')}</div>
        </div>
      </div>

      {/* Military vs civilian comparison bars */}
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3 space-y-3">
        <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400">
          {t('gaceta.charts.militaryVsCivilian')}
        </h4>
        {[
          { label: t('gaceta.military.militaryLabel'), count: military.length, color: '#EF9F27' },
          { label: t('gaceta.military.civilianLabel'), count: civilian, color: '#14b8a6' },
        ].map(({ label, count, color }) => (
          <div key={label}>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
              <span>{label}</span>
              <span>{count}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: records.length > 0 ? `${(count / records.length) * 100}%` : '0%',
                  background: color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ministry breakdown chart */}
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3">
        <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3">
          {t('gaceta.charts.ministriesBreakdown')}
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={ministryData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fontSize: 9, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1c', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }}
              cursor={{ fill: 'rgba(239,159,39,0.05)' }}
            />
            <Bar dataKey="count" fill="#EF9F27" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full military records table with search */}
      <div className="rounded-lg border border-white/5 bg-[#111113] overflow-hidden">
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 flex-1">
            {t('gaceta.tabs.militares')}
          </h4>
          <input
            type="text"
            placeholder={t('gaceta.table.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 w-48"
          />
        </div>
        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-[#0f0f10]">
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.date')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.military.rank')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.person')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.position')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.organism')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.type')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                    {t('gaceta.table.noResults')}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{r.gazette_date}</td>
                    <td className="px-3 py-2">
                      {r.military_rank ? (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#EF9F27]/20 text-[#EF9F27]">
                          {r.military_rank}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-zinc-200">{r.person_name || '—'}</td>
                    <td className="px-3 py-2 text-zinc-400 max-w-[140px] truncate">{r.post_or_position || '—'}</td>
                    <td className="px-3 py-2 text-zinc-400 max-w-[160px] truncate">{r.organism || '—'}</td>
                    <td className="px-3 py-2 text-zinc-500">{r.change_label}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
