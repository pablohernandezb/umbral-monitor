'use client'

import { useTranslation } from '@/i18n'
import type { IODAEntity } from '@/types/ioda'

interface RegionSelectorProps {
  selectedCode: string | null
  onSelect: (entity: IODAEntity | null) => void
  className?: string
}

export function RegionSelector({ className }: RegionSelectorProps) {
  const { t } = useTranslation()

  return (
    <select
      value=""
      disabled
      className={`h-7 rounded border border-umbral-ash bg-umbral-charcoal px-2 text-xs font-mono text-umbral-light
        focus:border-signal-teal focus:outline-none disabled:opacity-60 transition-colors
        cursor-default ${className ?? ''}`}
    >
      <option value="">{t('ioda.monitor.nationalRegion')}</option>
    </select>
  )
}
