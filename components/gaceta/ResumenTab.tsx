// components/gaceta/ResumenTab.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '@/i18n';
import { Shield } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import type { GacetaRecord, GacetaSummary } from '@/types';
import { LABEL_COLORS, topOrganisms } from './gaceta-utils';
import { createGacetaTranslator } from './gaceta-i18n';

function YAxisTickWithTooltip({ x, y, payload }: any) {
  const label: string = payload?.value ?? '';
  const maxChars = 28;
  if (label.length <= maxChars) {
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{label}</title>
        <text x={0} y={0} dy={3} textAnchor="end" fontSize={11} fill="#a1a1aa">
          {label}
        </text>
      </g>
    );
  }
  // Split into two lines at the nearest space
  const mid = label.lastIndexOf(' ', maxChars);
  const splitAt = mid > 0 ? mid : maxChars;
  const line1 = label.slice(0, splitAt);
  const line2 = label.slice(splitAt).trimStart();
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text x={0} y={0} textAnchor="end" fontSize={11} fill="#a1a1aa">
        <tspan x={0} dy={-4}>{line1}</tspan>
        <tspan x={0} dy={11}>{line2}</tspan>
      </text>
    </g>
  );
}

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
  const { t, locale } = useTranslation();
  const tg = createGacetaTranslator(locale);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const { ordinary, extraordinary } = useMemo(() => {
    const seen = new Set<string>();
    let ord = 0;
    let ext = 0;
    records.forEach((r) => {
      const key = `${r.gazette_number}-${r.gazette_type}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (r.gazette_type === 'Extraordinaria') ext++;
      else ord++;
    });
    return { ordinary: ord, extraordinary: ext };
  }, [records]);

  const dailyData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.gazette_date] = (counts[r.gazette_date] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [records]);

  const pieData = Object.entries(summary.changesByLabel)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ name: label, value }));

  const orgData = topOrganisms(records, 8).map((o) => ({
    name: tg('organism', o.organism) || o.organism,
    fullName: tg('organism', o.organism) || o.organism,
    count: o.count,
  }));

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard value={summary.totalChanges} label={t('gaceta.kpi.totalChanges')} />
        <MetricCard value={ordinary} label={t('gaceta.kpi.ordinaryGazettes')} />
        <MetricCard value={extraordinary} label={t('gaceta.kpi.extraordinaryGazettes')} />
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

      {/* Daily activity area chart */}
      <div className="rounded-lg border border-white/5 bg-[#111113] p-3">
        <h4 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3">
          {t('gaceta.charts.dailyActivity')}
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#6b6b76"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#3a3a42' }}
              tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
              interval={Math.max(0, Math.floor(dailyData.length / (isMobile ? 4 : 8)) - 1)}
              tickFormatter={(v: string) => {
                const d = new Date(v + 'T00:00:00');
                const m = d.toLocaleString(locale, { month: 'short' });
                const dd = String(d.getDate()).padStart(2, '0');
                return `${m}-${dd}`;
              }}
            />
            <YAxis
              stroke="#6b6b76"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b6b76', fontFamily: 'JetBrains Mono' }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a1c', border: '1px solid #3a3a42', borderRadius: '6px', fontSize: '12px' }}
              labelStyle={{ color: '#fff', fontFamily: 'JetBrains Mono', marginBottom: 4 }}
              itemStyle={{ color: '#14b8a6' }}
              cursor={{ stroke: '#14b8a6', strokeOpacity: 0.3 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#dailyGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#14b8a6', stroke: '#0a0a0b', strokeWidth: 2 }}
            />
          </AreaChart>
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
                width={220}
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
      </div>
    </div>
  );
}
