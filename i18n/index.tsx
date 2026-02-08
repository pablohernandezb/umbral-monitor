'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Import translations
import esTranslations from './es/common.json'
import enTranslations from './en/common.json'

export type Locale = 'es' | 'en'

const translations: Record<Locale, typeof esTranslations> = {
  es: esTranslations,
  en: enTranslations,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function I18nProvider({ children, defaultLocale = 'es' }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations[locale]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`)
      return key
    }
    
    // Replace parameters
    if (params) {
      let result = value
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue))
      }
      return result
    }
    
    return value
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale } = useI18n()
  return { t, locale }
}
