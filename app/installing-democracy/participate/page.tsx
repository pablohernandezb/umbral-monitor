'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { MonitoringTrackChooser } from '@/components/installing-democracy/MonitoringTrackChooser'
import { NewParticipantForm } from '@/components/installing-democracy/NewParticipantForm'
import { AccessCodeGate } from '@/components/installing-democracy/AccessCodeGate'
import { EvaluationForm } from '@/components/installing-democracy/EvaluationForm'
import { validateAccessCode } from './actions'

/** localStorage key for the remembered access code (monitoring spec §4). */
const STORAGE_KEY = 'umbral_monitor_code'

type Screen = 'loading' | 'chooser' | 'new' | 'gate' | 'evaluate'

export default function MonitoringParticipatePage() {
  const { t } = useTranslation()
  const [screen, setScreen] = useState<Screen>('loading')
  const [code, setCode] = useState<string | null>(null)

  // A remembered code is re-validated server-side on every visit — it is
  // never trusted just because it's in localStorage.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setScreen('chooser')
      return
    }
    validateAccessCode(stored).then(result => {
      if (result.ok) {
        setCode(stored)
        setScreen('evaluate')
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
        setScreen('chooser')
      }
    })
  }, [])

  function handleValidated(validCode: string) {
    window.localStorage.setItem(STORAGE_KEY, validCode)
    setCode(validCode)
    setScreen('evaluate')
  }

  function handleSignOut() {
    window.localStorage.removeItem(STORAGE_KEY)
    setCode(null)
    setScreen('chooser')
  }

  return (
    <div className="relative min-h-screen">
      <section className="relative py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <Link
            href="/installing-democracy"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-umbral-charcoal border border-signal-teal text-white text-sm font-medium hover:bg-umbral-ash hover:border-signal-teal/80 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('installingDemocracy.title')}
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {t('installingDemocracy.participate.title')}
          </h1>
          <p className="text-sm md:text-base text-umbral-muted leading-relaxed">
            {t('installingDemocracy.participate.intro')}
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className={screen === 'evaluate' ? 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8' : 'max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'}>
          {screen === 'loading' && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-signal-teal animate-spin" aria-hidden="true" />
            </div>
          )}

          {screen === 'chooser' && (
            <MonitoringTrackChooser onChoose={track => setScreen(track === 'new' ? 'new' : 'gate')} />
          )}

          {screen === 'new' && (
            <div className="space-y-4">
              <NewParticipantForm />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setScreen('chooser')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-umbral-charcoal border border-signal-teal text-white text-sm font-medium hover:bg-umbral-ash hover:border-signal-teal/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {t('installingDemocracy.participate.back')}
                </button>
              </div>
            </div>
          )}

          {screen === 'gate' && (
            <div className="space-y-4">
              <AccessCodeGate onValidated={handleValidated} />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setScreen('chooser')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-umbral-charcoal border border-signal-teal text-white text-sm font-medium hover:bg-umbral-ash hover:border-signal-teal/80 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {t('installingDemocracy.participate.back')}
                </button>
              </div>
            </div>
          )}

          {screen === 'evaluate' && code && (
            <EvaluationForm code={code} onSignOut={handleSignOut} />
          )}
        </div>
      </section>
    </div>
  )
}
