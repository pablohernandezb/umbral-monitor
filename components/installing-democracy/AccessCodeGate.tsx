'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { validateAccessCode } from '@/app/installing-democracy/participate/actions'

interface AccessCodeGateProps {
  onValidated: (code: string, evaluatorId: string) => void
}

/**
 * The Returning Expert code entry (monitoring spec §8.1). Pure UI + the
 * validate call — localStorage persistence is owned by the parent page so
 * there is exactly one place that reads/writes `umbral_monitor_code`.
 */
export function AccessCodeGate({ onValidated }: AccessCodeGateProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [invalid, setInvalid] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!code.trim() || checking) return

    setChecking(true)
    setInvalid(false)
    const result = await validateAccessCode(code)
    setChecking(false)

    if (!result.ok) {
      setInvalid(true)
      return
    }
    onValidated(code.trim().toUpperCase(), result.evaluatorId)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-xs text-umbral-muted mb-1.5">
          {t('installingDemocracy.participate.code.label')}
        </label>
        <input
          type="text"
          value={code}
          onChange={e => {
            setCode(e.target.value)
            setInvalid(false)
          }}
          placeholder={t('installingDemocracy.participate.code.enter')}
          autoCapitalize="characters"
          spellCheck={false}
          className="w-full px-3 py-2.5 bg-umbral-charcoal border border-umbral-ash rounded-md text-sm font-mono tracking-wider text-white placeholder-umbral-muted focus:outline-none focus:border-signal-teal"
        />
      </div>

      {invalid && (
        <p className="text-sm text-signal-red">{t('installingDemocracy.participate.code.invalid')}</p>
      )}

      <button
        type="submit"
        disabled={!code.trim() || checking}
        className="btn btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {checking && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {t('installingDemocracy.participate.code.submit')}
      </button>
    </form>
  )
}
