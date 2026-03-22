// components/gaceta/DesignacionesTab.tsx
'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { ExternalLink } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { GacetaRecord } from '@/types';
import { gazetteUrl } from './gaceta-utils';
import { createGacetaTranslator } from './gaceta-i18n';

interface Props {
  records: GacetaRecord[];
}

export default function DesignacionesTab({ records }: Props) {
  const { t, locale } = useTranslation();
  const tg = createGacetaTranslator(locale);

  const designaciones = useMemo(
    () => records.filter((r) => r.change_label === 'Designación'),
    [records]
  );

  const militaryCount = useMemo(
    () => designaciones.filter((r) => r.is_military_person).length,
    [designaciones]
  );

  const militaryPct = designaciones.length > 0
    ? Math.round((militaryCount / designaciones.length) * 100)
    : 0;

  const subtypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    designaciones.forEach((r) => {
      counts[r.change_type] = (counts[r.change_type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([type, count]) => {
        const label = type.replace(/^DESIGNACION_/i, '')
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        return {
          name: label.length > 24 ? label.slice(0, 24) + '…' : label,
          fullName: label,
          count,
        };
      });
  }, [designaciones]);

  const recent = useMemo(
    () => [...designaciones].sort((a, b) => b.gazette_date.localeCompare(a.gazette_date)).slice(0, 10),
    [designaciones]
  );

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 text-center">
          <div className="font-display text-xl font-medium text-teal-400">{designaciones.length}</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.kpi.designations')}</div>
        </div>
        <div className="rounded-lg border border-danger-red/30 bg-danger-red/5 p-3 text-center">
          <div className="font-display text-xl font-medium text-[#C04828]">{militaryCount}</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.kpi.militaryPersons')}</div>
        </div>
        <div className="rounded-lg border border-warning-amber/30 bg-warning-amber/5 p-3 text-center">
          <div className="font-display text-xl font-medium text-[#BA7517]">{militaryPct}%</div>
          <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{t('gaceta.kpi.militaryPct')}</div>
        </div>
      </div>

      {/* Subtype bar chart */}
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3">
        <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3">
          {t('gaceta.charts.designationTypes')}
        </h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={subtypeData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
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
              formatter={(value: number, _name: string, props: any) => [value, props.payload?.fullName || '']}
              cursor={{ fill: 'rgba(20,184,166,0.05)' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent designations table */}
      <div className="rounded-lg border border-white/5 bg-[#111113] overflow-hidden">
        <div className="px-3 py-2 border-b border-white/5">
          <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400">
            {t('gaceta.lastAppointments')}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500">
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.date')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.gazette')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.person')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.position')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('gaceta.table.organism')}</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
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
                  <td className="px-3 py-2 text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      {r.person_name || '—'}
                      {r.is_military_person && (
                        <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-[#EF9F27]/20 text-[#EF9F27] uppercase">
                          {t('gaceta.military.person')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-zinc-400 max-w-[160px] truncate">{tg('post_or_position', r.post_or_position) || '—'}</td>
                  <td className="px-3 py-2 text-zinc-400 max-w-[180px] truncate">{tg('organism', r.organism) || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
