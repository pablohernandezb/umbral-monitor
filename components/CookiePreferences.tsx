'use client'

import { useCookieConsent } from '@/lib/cookie-consent'
import { useTranslation } from '@/i18n'

/**
 * Cookie Preferences Button
 * Can be added to footer or settings page to allow users to change their consent
 */
export default function CookiePreferences() {
  const { hasConsent, resetConsent } = useCookieConsent()
  const { t } = useTranslation()

  if (hasConsent === null) return null

  return (
    <button
      onClick={resetConsent}
      className="text-sm text-gray-400 hover:text-teal-400 transition-colors"
      title={t('cookiePreferences.manage')}
    >
      {hasConsent ? t('cookiePreferences.enabled') : t('cookiePreferences.disabled')}
    </button>
  )
}
