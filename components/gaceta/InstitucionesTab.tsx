// components/gaceta/InstitucionesTab.tsx
'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { ExternalLink } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { GacetaRecord } from '@/types';
import { gazetteUrl } from './gaceta-utils';

function YAxisTickWithTooltip({ x, y, payload }: any) {
  const label: string = payload?.value ?? '';
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text x={0} y={0} dy={3} textAnchor="end" fontSize={9} fill="#71717a">
        {label}
      </text>
    </g>
  );
}

interface Props {
  records: GacetaRecord[];
}

export default function InstitucionesTab({ records }: Props) {
  const { t } = useTranslation();

  const uniqueOrganisms = useMemo(() => {
    const set = new Set(records.map((r) => r.organism).filter(Boolean));
    return set.size;
  }, [records]);

  const ministries = useMemo(() => {
    const set = new Set(
      records
        .map((r) => r.organism)
        .filter((o) => o && (o.toLowerCase().includes('ministerio') || o.toLowerCase().includes('ministry')))
    );
    return set.size;
  }, [records]);

  const structural = useMemo(() => {
    const suppressions = records.filter((r) => r.change_label === 'Supresión');
    const reorganizations = records.filter((r) => r.change_label === 'Reorganización');
    const creations = records.filter((r) => r.change_type.toUpperCase().startsWith('CREACION_'));
    return { suppressions, reorganizations, creations };
  }, [records]);

  const orgData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      if (!r.organism) return;
      counts[r.organism] = (counts[r.organism] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, count]) => {
        const short = name
          .replace(/Ministerio del Poder Popular/gi, 'MPP')
          .replace(/\s+para\s+(la|el|las|los)\s+/gi, ' ');
        return {
          name: short.length > 80 ? short.slice(0, 80) + '…' : short,
          fullName: short,
          count,
        };
      });
  }, [records]);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 text-center">
          <div className="font-display text-xl font-medium text-teal-400">{uniqueOrganisms}</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.organismsunique')}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 text-center">
          <div className="font-display text-xl font-medium text-teal-400">{ministries}</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.ministerios')}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 text-center">
          <div className="font-display text-xl font-medium text-teal-400">
            {structural.suppressions.length + structural.reorganizations.length + structural.creations.length}
          </div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.structural.title')}</div>
        </div>
      </div>

      {/* Top 15 organisms bar chart */}
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3">
        <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3">
          {t('gaceta.charts.topOrganisms')}
        </h4>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={orgData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={340}
              tick={<YAxisTickWithTooltip />}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1c', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }}
              formatter={(value: number, _name: string, props: any) => [value, props.payload?.fullName || '']}
              cursor={{ fill: 'rgba(20,184,166,0.05)' }}
            />
            <Bar dataKey="count" fill="#14b8a6" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Structural events panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { key: 'suppressions', label: t('gaceta.structural.suppressions'), items: structural.suppressions, color: '#ef4444' },
          { key: 'reorganizations', label: t('gaceta.structural.reorganizations'), items: structural.reorganizations, color: '#14b8a6' },
          { key: 'creations', label: t('gaceta.structural.creations'), items: structural.creations, color: '#22c55e' },
        ].map(({ key, label, items, color }) => (
          <div key={key} className="rounded-lg border border-white/5 bg-[#111113] p-3">
            <h4 className="font-display text-xs font-medium uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              {label} ({items.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-[10px] text-zinc-600">{t('gaceta.table.noResults')}</p>
              ) : (
                items.map((r) => (
                  <div key={r.id} className="text-[10px] border-b border-white/5 pb-1.5">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span>{r.gazette_date}</span>
                      <a
                        href={gazetteUrl(r.gazette_number)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-teal-400 hover:underline"
                      >
                        #{r.gazette_number}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="text-zinc-300 truncate">{r.organism || r.institution || '—'}</div>
                    {r.summary && (
                      <div className="text-zinc-500 line-clamp-2 mt-0.5">{r.summary}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
