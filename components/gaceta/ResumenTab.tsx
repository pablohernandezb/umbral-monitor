// components/gaceta/ResumenTab.tsx
'use client';

import { useTranslation } from '@/i18n';
import { Shield } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { GacetaRecord, GacetaSummary } from '@/types';
import { LABEL_COLORS, topOrganisms } from './gaceta-utils';

interface Props {
  records: GacetaRecord[];
  summary: GacetaSummary;
}

function MetricCard({
  value,
  label,
  variant = 'default',
}: {
  value: string | number;
  label: string;
  variant?: 'default' | 'military' | 'warning';
}) {
  const borderClass =
    variant === 'military'
      ? 'border-danger-red/30 bg-danger-red/5'
      : variant === 'warning'
      ? 'border-warning-amber/30 bg-warning-amber/5'
      : 'border-white/5 bg-[#111113]';

  const valueClass =
    variant === 'military'
      ? 'text-[#C04828]'
      : variant === 'warning'
      ? 'text-[#BA7517]'
      : 'text-teal-400';

  return (
    <div className={`rounded-lg border ${borderClass} p-3 text-center`}>
      <div className={`font-display text-xl font-medium ${valueClass}`}>{value}</div>
      <div className="mt-1 text-[10px] text-zinc-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function ResumenTab({ records, summary }: Props) {
  const { t } = useTranslation();

  const weeklyData = summary.byWeek.map((w) => ({ name: w.label, count: w.count }));

  const pieData = Object.entries(summary.changesByLabel)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ name: label, value }));

  const orgData = topOrganisms(records, 8).map((o) => ({
    name: o.organism.length > 28 ? o.organism.slice(0, 28) + '…' : o.organism,
    fullName: o.organism,
    count: o.count,
  }));

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard value={summary.totalChanges} label={t('gaceta.kpi.totalChanges')} />
        <MetricCard value={summary.designations} label={t('gaceta.kpi.designations')} />
        <MetricCard value={summary.militaryPersons} label={t('gaceta.kpi.militaryPersons')} variant="military" />
        <MetricCard value={summary.militaryPosts} label={t('gaceta.kpi.militaryPosts')} variant="warning" />
      </div>

      {/* Military % banner */}
      {summary.militaryPct > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[#BA7517]/30 bg-[#BA7517]/5 px-4 py-2.5">
          <Shield className="w-4 h-4 text-[#EF9F27] flex-shrink-0" />
          <p className="text-[11px] text-[#EF9F27]">
            {t('gaceta.military.banner').replace('{pct}', String(summary.militaryPct))}
          </p>
        </div>
      )}

      {/* Weekly activity bar chart */}
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3">
        <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3">
          {t('gaceta.charts.weeklyActivity')}
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1a1a1c', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }}
              cursor={{ fill: 'rgba(20,184,166,0.05)' }}
            />
            <Bar dataKey="count" fill="#14b8a6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2-column: pie + organisms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Change type donut */}
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 h-[300px] flex flex-col">
          <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-2 flex-shrink-0">
            {t('gaceta.charts.changeTypes')}
          </h4>
          <div className="flex flex-wrap gap-1.5 mb-1 flex-shrink-0">
            {pieData.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] text-zinc-400">
                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: LABEL_COLORS[d.name as keyof typeof LABEL_COLORS] || '#555' }} />
                {t(`gaceta.labels.${d.name}`)} ({d.value})
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={1} dataKey="value">
                {pieData.map((d) => (
                  <Cell key={d.name} fill={LABEL_COLORS[d.name as keyof typeof LABEL_COLORS] || '#555'} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1c', border: '1px solid #333', borderRadius: '6px', fontSize: '12px' }}
                formatter={(value: number, name: string) => [value, t(`gaceta.labels.${name}`)]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top organisms horizontal bar */}
        <div className="rounded-lg border border-white/5 bg-[#111113] p-3 h-[300px] flex flex-col">
          <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3 flex-shrink-0">
            {t('gaceta.charts.topOrganisms')}
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={orgData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 9, fill: '#71717a' }}
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
      </div>
    </div>
  );
}
