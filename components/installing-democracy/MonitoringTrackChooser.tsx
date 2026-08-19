'use client'

import { UserPlus, KeyRound } from 'lucide-react'
import { useTranslation } from '@/i18n'

interface MonitoringTrackChooserProps {
  onChoose: (track: 'new' | 'returning') => void
}

/** The New Participant / Returning Expert segmented choice (monitoring spec §6). */
export function MonitoringTrackChooser({ onChoose }: MonitoringTrackChooserProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => onChoose('new')}
        className="card flex items-center gap-3 p-6 text-left hover:border-signal-teal/50 transition-colors group"
      >
        <UserPlus className="w-9 h-9 text-signal-teal shrink-0" aria-hidden="true" />
        <p className="text-base font-semibold text-white group-hover:text-signal-teal transition-colors">
          {t('installingDemocracy.participate.tracks.new')}
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChoose('returning')}
        className="card flex items-center gap-3 p-6 text-left hover:border-signal-teal/50 transition-colors group"
      >
        <KeyRound className="w-9 h-9 text-signal-teal shrink-0" aria-hidden="true" />
        <p className="text-base font-semibold text-white group-hover:text-signal-teal transition-colors">
          {t('installingDemocracy.participate.tracks.returning')}
        </p>
      </button>
    </div>
  )
}
