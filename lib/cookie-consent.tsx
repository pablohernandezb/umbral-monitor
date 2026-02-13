'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CookieConsentContextType {
  hasConsent: boolean | null  // null = not decided yet, true = accepted, false = rejected
  acceptCookies: () => void
  rejectCookies: () => void
  resetConsent: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

const CONSENT_KEY = 'umbral-cookie-consent'

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null)

  useEffect(() => {
    // Check for existing consent on mount
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored !== null) {
      setHasConsent(stored === 'true')
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'true')
    setHasConsent(true)
  }

  const rejectCookies = () => {
    localStorage.setItem(CONSENT_KEY, 'false')
    setHasConsent(false)
  }

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_KEY)
    setHasConsent(null)
  }

  return (
    <CookieConsentContext.Provider value={{ hasConsent, acceptCookies, rejectCookies, resetConsent }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}
