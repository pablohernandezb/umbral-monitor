// components/blocking/BlockTypeDonut.tsx
'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  PROVIDERS,
  BLOCK_TYPES,
  BLOCK_TYPE_COLORS,
  getProviderValue,
  normalizeBlockTypes,
} from './blocking-utils';

interface Props {
  data: Record<string, string>[];
  activeBlockType: string | null;
  activeCategory: string | null;
  onBlockTypeClick: (blockType: string) => void;
}

export default function BlockTypeDonut({
  data,
  activeBlockType,
  activeCategory,
  onBlockTypeClick,
}: Props) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    let filtered = data;
    if (activeCategory)
      filtered = filtered.filter((d) => d.category === activeCategory);

    const counts: Record<string, number> = {};
    filtered.forEach((d) => {
      PROVIDERS.forEach((p) => {
        const value = getProviderValue(d, p);
        if (value === 'ok') return;
        normalizeBlockTypes(value).forEach((bt) => {
          if (bt !== 'ok') counts[bt] = (counts[bt] || 0) + 1;
        });
      });
    });

    return BLOCK_TYPES.filter((bt) => bt !== 'ok' && counts[bt])
      .map((bt) => ({
        name: bt,
        label: bt,
        value: counts[bt] || 0,
      }));
  }, [data, activeCategory, t]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-lg border border-white/5 bg-[#111113] p-3 h-full flex flex-col overflow-hidden">
      <h3 className="font-display text-xs font-medium uppercase tracking-widest text-teal-400 mb-3 flex-shrink-0">
        {t('blocking.methods')}
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-2 flex-shrink-0">
        {chartData.map((d) => (
          <button
            key={d.name}
            onClick={() => onBlockTypeClick(d.name)}
            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-all ${
              activeBlockType === d.name
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ background: BLOCK_TYPE_COLORS[d.name] || '#555' }}
            />
            {d.label} ({d.value})
          </button>
        ))}
      </div>

      {/* Donut */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={1}
            dataKey="value"
            cursor="pointer"
            onClick={(_, idx) => onBlockTypeClick(chartData[idx].name)}
          >
            {chartData.map((d) => (
              <Cell
                key={d.name}
                fill={BLOCK_TYPE_COLORS[d.name] || '#555'}
                opacity={
                  activeBlockType && activeBlockType !== d.name ? 0.25 : 1
                }
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1a1a1c',
              border: '1px solid #333',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => {
              const label = chartData.find((d) => d.name === name)?.label ?? name;
              return [`${value} (${Math.round((value / total) * 100)}%)`, label];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
