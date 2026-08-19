'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { submitMonitoringApplication } from '@/app/installing-democracy/participate/actions'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const inputClass =
  'w-full px-3 py-2.5 bg-umbral-charcoal border border-umbral-ash rounded-md text-sm text-white placeholder-umbral-muted focus:outline-none focus:border-signal-teal'

/** The New Participant application form (monitoring spec §7). No code is ever shown here. */
export function NewParticipantForm() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [institution, setInstitution] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const valid = name.trim() && institution.trim() && EMAIL_REGEX.test(email.trim())

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid || submitting) return

    setSubmitting(true)
    setError(null)
    const result = await submitMonitoringApplication({ name, email, institution })
    setSubmitting(false)

    if (!result.ok) {
      const key =
        result.error === 'already_pending'
          ? 'installingDemocracy.participate.form.alreadyPending'
          : result.error === 'already_approved'
          ? 'installingDemocracy.participate.form.alreadyApproved'
          : result.error === 'invalid_email'
          ? 'installingDemocracy.participate.form.invalidEmail'
          : 'installingDemocracy.participate.form.genericError'
      setError(t(key))
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="card p-6 md:p-8 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-signal-teal mx-auto" aria-hidden="true" />
        <p className="text-base font-semibold text-white">
          {t('installingDemocracy.participate.form.received.title')}
        </p>
        <p className="text-sm text-umbral-muted">
          {t('installingDemocracy.participate.form.received.body')}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-4">
      <div>
        <label className="block text-xs text-umbral-muted mb-1.5">
          {t('installingDemocracy.participate.form.name')}
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className="block text-xs text-umbral-muted mb-1.5">
          {t('installingDemocracy.participate.form.email')}
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label className="block text-xs text-umbral-muted mb-1.5">
          {t('installingDemocracy.participate.form.institution')}
        </label>
        <input
          type="text"
          value={institution}
          onChange={e => setInstitution(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      {error && <p className="text-sm text-signal-red">{error}</p>}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="btn btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {t('installingDemocracy.participate.form.submit')}
      </button>
    </form>
  )
}
