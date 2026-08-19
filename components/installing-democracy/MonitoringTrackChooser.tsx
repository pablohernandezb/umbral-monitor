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
        className="card p-6 text-left hover:border-signal-teal/50 transition-colors group"
      >
        <UserPlus className="w-6 h-6 text-signal-teal mb-3" aria-hidden="true" />
        <p className="text-base font-semibold text-white group-hover:text-signal-teal transition-colors">
          {t('installingDemocracy.participate.tracks.new')}
        </p>
      </button>

      <button
        type="button"
        onClick={() => onChoose('returning')}
        className="card p-6 text-left hover:border-signal-teal/50 transition-colors group"
      >
        <KeyRound className="w-6 h-6 text-signal-teal mb-3" aria-hidden="true" />
        <p className="text-base font-semibold text-white group-hover:text-signal-teal transition-colors">
          {t('installingDemocracy.participate.tracks.returning')}
        </p>
      </button>
    </div>
  )
}
