// components/blocking/ProviderBarChart.tsx
'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  PROVIDERS,
  BLOCK_TYPES,
  BLOCK_TYPE_COLORS,
  buildProviderBreakdown,
} from './blocking-utils';

interface Props {
  data: Record<string, string>[];
  activeProvider: string | null;
  activeBlockType: string | null;
  activeCategory: string | null;
  onProviderClick: (provider: string) => void;
  onBlockTypeClick: (blockType: string) => void;
}

export default function ProviderBarChart({
  data,
  activeProvider,
  activeBlockType,
  activeCategory,
  onProviderClick,
  onBlockTypeClick,
}: Props) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      buildProviderBreakdown(data, activeCategory).map((row) => ({
        name: row.provider,
        ...row.percentages,
      })),
    [data, activeCategory]
  );

  return (
    <div className="rounded-lg border border-white/5 bg-[#111113] p-3">
      <h3 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3">
        {t('blocking.providers')}
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-3">
        {BLOCK_TYPES.map((bt) => (
          <button
            key={bt}
            onClick={() => onBlockTypeClick(bt)}
            className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border transition-all ${
              activeBlockType === bt
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: BLOCK_TYPE_COLORS[bt] }}
            />
            {bt === 'ok' ? t('blocking.accessible') : bt}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
          barCategoryGap="15%"
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: '#71717a', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#e4e4e7', fontSize: 12, fontFamily: 'Space Grotesk' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1c',
              border: '1px solid #333',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              `${value}%`,
              name === 'ok' ? 'Accessible' : name,
            ]}
          />
          {BLOCK_TYPES.map((bt) => (
            <Bar
              key={bt}
              dataKey={bt}
              stackId="stack"
              fill={BLOCK_TYPE_COLORS[bt]}
              cursor="pointer"
              onClick={(barData) => {
                if (barData?.name) onProviderClick(barData.name);
              }}
              radius={[0, 0, 0, 0]}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  opacity={
                    activeProvider && entry.name !== activeProvider ? 0.3 : 1
                  }
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
