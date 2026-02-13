'use client'

import { useCookieConsent } from '@/lib/cookie-consent'
import { useTranslation } from '@/i18n'
import { useEffect, useState } from 'react'

export default function CookieBanner() {
  const { hasConsent, acceptCookies, rejectCookies } = useCookieConsent()
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show banner only if consent hasn't been decided
    if (hasConsent === null) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [hasConsent])

  if (!isVisible || hasConsent !== null) return null

  const handleAccept = () => {
    acceptCookies()
    setIsVisible(false)
  }

  const handleReject = () => {
    rejectCookies()
    setIsVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-umbral-charcoal/95 backdrop-blur-md border border-teal-500/20 rounded-lg shadow-2xl shadow-teal-500/10">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-teal-400 mb-2 font-grotesk">
                🍪 {t('cookieBanner.title')}
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                {t('cookieBanner.description')}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {t('cookieBanner.details')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-umbral-black/50 hover:bg-umbral-black border border-gray-600 rounded-md transition-colors"
              >
                {t('cookieBanner.reject')}
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm font-medium text-umbral-black bg-teal-500 hover:bg-teal-400 rounded-md transition-colors font-grotesk"
              >
                {t('cookieBanner.accept')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
