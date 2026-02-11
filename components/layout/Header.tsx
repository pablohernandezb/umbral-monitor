'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Globe, Coffee, HelpCircle, BookOpen } from 'lucide-react'
import { useI18n, useTranslation, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { locale, setLocale } = useI18n()
  const { t } = useTranslation()
  const pathname = usePathname()

  const navigation = [
    { name: locale === 'es' ? 'Monitor' : 'Monitor', href: '/#scenarios' },
    { name: locale === 'es' ? 'Episodios' : 'Episodes', href: '/#trajectory' },
    { name: locale === 'es' ? 'Noticias' : 'News', href: '/#news' },
    { name: locale === 'es' ? 'Presos Políticos' : 'Political Prisoners', href: '/#prisoners' },
    { name: locale === 'es' ? 'Acerca' : 'About', href: '/about' },
  ]

  const toggleLocale = () => {
    setLocale(locale === 'es' ? 'en' : 'es')
  }

  const CustomGradientIcon = ({ className = "w-5 h-5" }) => (
  <img 
    src="/images/icon_transparent.svg" 
    className={className} 
    alt="" 
    aria-hidden="true" 
  />
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-umbral-black/80 backdrop-blur-md border-b border-umbral-ash">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-umbral-ash/10 border border-umbral-ash/80 flex items-center justify-center group-hover:bg-signal-teal/20 transition-colors">
              <CustomGradientIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white font-display tracking-tight">
                Umbral
              </span>
              <span className="text-[10px] text-umbral-muted uppercase tracking-widest hidden sm:block">
                {locale === 'es' ? 'Monitor de transformación de régimen' : 'Regime transformation monitor'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href
                    ? 'text-signal-teal bg-signal-teal/10'
                    : 'text-umbral-light hover:text-white hover:bg-umbral-ash'
                )}
              >
                {item.name}
              </Link>
            ))}

            {/* Icon buttons */}
            <Link
              href="/#faq"
              className="p-2 text-umbral-light hover:text-white hover:bg-umbral-ash rounded-md transition-colors"
              title={locale === 'es' ? 'Preguntas Frecuentes' : 'FAQ'}
            >
              <HelpCircle className="w-4 h-4" />
            </Link>
            <Link
              href="/reading-room"
              className="p-2 text-umbral-light hover:text-white hover:bg-umbral-ash rounded-md transition-colors"
              title={locale === 'es' ? 'Sala de Lectura' : 'Reading Room'}
            >
              <BookOpen className="w-4 h-4" />
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-umbral-light hover:text-white bg-umbral-ash/50 hover:bg-umbral-ash rounded-md transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{locale}</span>
            </button>

            {/* Donate button (mobile - icon only) */}
            <Link
              href="https://buymeacoffee.com/pablohernandezb"
              target="_blank"
              rel="noopener noreferrer"
              className="sm:hidden btn btn-primary p-2"
              title={t('common.donateToTheProject')}
            >
              <Coffee className="w-4 h-4" />
            </Link>

            {/* Donate button (desktop - with text) */}
            <Link
              href="https://buymeacoffee.com/pablohernandezb"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex gap-2 btn btn-primary text-xs"
            >
              <Coffee className="w-4 h-4" />
              {t('common.donateToTheProject')}
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-umbral-light hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-umbral-ash">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    pathname === item.href
                      ? 'text-signal-teal bg-signal-teal/10'
                      : 'text-umbral-light hover:text-white hover:bg-umbral-ash'
                  )}
                >
                  {item.name}
                </Link>
              ))}

              {/* Icon links */}
              <Link
                href="/#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-umbral-light hover:text-white hover:bg-umbral-ash"
              >
                <HelpCircle className="w-4 h-4" />
                {locale === 'es' ? 'Preguntas Frecuentes' : 'FAQ'}
              </Link>
              <Link
                href="/reading-room"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-umbral-light hover:text-white hover:bg-umbral-ash"
              >
                <BookOpen className="w-4 h-4" />
                {locale === 'es' ? 'Sala de Lectura' : 'Reading Room'}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
