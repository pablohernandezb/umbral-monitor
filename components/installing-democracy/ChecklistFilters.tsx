'use client'

import { Search } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { PILLAR_ICONS } from './icons'
import { TRANSITION_PHASES } from '@/data/transition-phases'
import type { TransitionStatus } from '@/types'

export interface ChecklistFilterState {
  pillar: string | 'all'
  phase: number | 'all'
  status: TransitionStatus | 'all'
  search: string
}

const STATUSES: TransitionStatus[] = ['pending', 'in_progress', 'completed', 'stalled']

interface ChecklistFiltersProps {
  value: ChecklistFilterState
  onChange: (next: ChecklistFilterState) => void
}

export function ChecklistFilters({ value, onChange }: ChecklistFiltersProps) {
  const { t } = useTranslation()
  const pillarKeys = Object.keys(PILLAR_ICONS)

  const selectClass =
    'bg-umbral-charcoal border border-umbral-ash rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-signal-teal'

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <div className="relative flex-1 min-w-[180px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-umbral-muted" />
        <input
          type="text"
          value={value.search}
          onChange={e => onChange({ ...value, search: e.target.value })}
          placeholder={t('installingDemocracy.filters.search')}
          className="w-full pl-9 pr-3 py-2 bg-umbral-charcoal border border-umbral-ash rounded-md text-sm text-white placeholder-umbral-muted focus:outline-none focus:border-signal-teal"
        />
      </div>

      <select
        value={value.pillar}
        onChange={e => onChange({ ...value, pillar: e.target.value })}
        className={selectClass}
        aria-label={t('installingDemocracy.filters.pillar')}
      >
        <option value="all">{t('installingDemocracy.filters.all')} — {t('installingDemocracy.filters.pillar')}</option>
        {pillarKeys.map(key => (
          <option key={key} value={key}>{t(`installingDemocracy.pillars.${key}`)}</option>
        ))}
      </select>

      <select
        value={value.phase}
        onChange={e => onChange({ ...value, phase: e.target.value === 'all' ? 'all' : Number(e.target.value) })}
        className={selectClass}
        aria-label={t('installingDemocracy.filters.milestone')}
      >
        <option value="all">{t('installingDemocracy.filters.all')} — {t('installingDemocracy.filters.milestone')}</option>
        {TRANSITION_PHASES.map(def => (
          <option key={def.phase} value={def.phase}>{t(`installingDemocracy.phases.${def.key}.title`)}</option>
        ))}
      </select>

      <select
        value={value.status}
        onChange={e => onChange({ ...value, status: e.target.value as ChecklistFilterState['status'] })}
        className={selectClass}
        aria-label={t('installingDemocracy.filters.status')}
      >
        <option value="all">{t('installingDemocracy.filters.all')} — {t('installingDemocracy.filters.status')}</option>
        {STATUSES.map(s => (
          <option key={s} value={s}>{t(`installingDemocracy.status.${s}`)}</option>
        ))}
      </select>
    </div>
  )
}
