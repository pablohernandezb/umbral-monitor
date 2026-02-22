'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Globe, Coffee, HelpCircle, BookOpen, Newspaper, Share2, Check, Link2, Mail } from 'lucide-react'
import { useI18n, useTranslation } from '@/i18n'
import { cn } from '@/lib/utils'

const XTwitterIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const MessengerIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.26L19.752 8l-6.561 6.963z" />
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const TelegramIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

function ShareOption({ icon, label, onClick, active }: {
  icon: ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left',
        active
          ? 'text-signal-teal'
          : 'text-umbral-light hover:text-white hover:bg-umbral-ash'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function ShareButton({ locale, className }: { locale: string; className?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const getUrl = () => window.location.href
  const getTitle = () => document.title

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
    setIsOpen(false)
  }

  const handleNativeShare = async () => {
    try { await navigator.share({ url: getUrl(), title: getTitle() }) } catch {}
    setIsOpen(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(v => !v)}
        className={cn(
          'p-2 rounded-md transition-colors',
          isOpen
            ? 'text-signal-teal bg-signal-teal/10'
            : 'text-umbral-light hover:text-white hover:bg-umbral-ash'
        )}
        title={locale === 'es' ? 'Compartir' : 'Share'}
      >
        <Share2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-umbral-black border border-umbral-ash rounded-lg shadow-2xl z-[100] overflow-hidden">
          <p className="px-3 py-2.5 text-xs font-semibold text-umbral-muted uppercase tracking-wider border-b border-umbral-ash">
            {locale === 'es' ? 'Compartir esta página' : 'Share this page'}
          </p>
          <div className="py-1">
            {typeof navigator !== 'undefined' && !!navigator.share && (
              <ShareOption
                icon={<Share2 className="w-4 h-4" />}
                label={locale === 'es' ? 'Compartir...' : 'Share...'}
                onClick={handleNativeShare}
              />
            )}
            <ShareOption
              icon={<XTwitterIcon />}
              label="X / Twitter"
              onClick={() => openWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getUrl())}&text=${encodeURIComponent(getTitle())}`)}
            />
            <ShareOption
              icon={<FacebookIcon />}
              label="Facebook"
              onClick={() => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`)}
            />
            <ShareOption
              icon={<MessengerIcon />}
              label="Messenger"
              onClick={() => openWindow(`fb-messenger://share/?link=${encodeURIComponent(getUrl())}`)}
            />
            <ShareOption
              icon={<WhatsAppIcon />}
              label="WhatsApp"
              onClick={() => openWindow(`https://api.whatsapp.com/send?text=${encodeURIComponent(getTitle() + ' ' + getUrl())}`)}
            />
            <ShareOption
              icon={<TelegramIcon />}
              label="Telegram"
              onClick={() => openWindow(`https://t.me/share/url?url=${encodeURIComponent(getUrl())}&text=${encodeURIComponent(getTitle())}`)}
            />
            <ShareOption
              icon={<LinkedInIcon />}
              label="LinkedIn"
              onClick={() => openWindow(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getUrl())}`)}
            />
            <ShareOption
              icon={<Mail className="w-4 h-4" />}
              label={locale === 'es' ? 'Correo electrónico' : 'Email'}
              onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent(getTitle())}&body=${encodeURIComponent(getUrl())}`; setIsOpen(false) }}
            />
            <div className="my-1 border-t border-umbral-ash" />
            <ShareOption
              icon={copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              label={copied
                ? (locale === 'es' ? '¡Enlace copiado!' : 'Link copied!')
                : (locale === 'es' ? 'Copiar enlace' : 'Copy link')
              }
              onClick={handleCopyLink}
              active={copied}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { locale, setLocale } = useI18n()
  const { t } = useTranslation()
  const pathname = usePathname()

  const navigation = [
    { name: locale === 'es' ? 'Monitor' : 'Monitor', href: '/#scenarios' },
    { name: locale === 'es' ? 'Episodios' : 'Episodes', href: '/#trajectory' },
    { name: locale === 'es' ? 'Señales' : 'Signals', href: '/#news' },
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
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-umbral-black/80 backdrop-blur-md border-b border-umbral-ash">
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
            <Link
              href="/news"
              className="p-2 text-umbral-light hover:text-white hover:bg-umbral-ash rounded-md transition-colors"
              title={locale === 'es' ? 'Sala de Noticias' : 'News Room'}
            >
              <Newspaper className="w-4 h-4" />
            </Link>
            <ShareButton locale={locale} />
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Share button (mobile only — desktop version is in the nav icon row) */}
            <ShareButton locale={locale} className="md:hidden" />

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
              <Link
                href="/news"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-umbral-light hover:text-white hover:bg-umbral-ash"
              >
                <Newspaper className="w-4 h-4" />
                {locale === 'es' ? 'Sala de Noticias' : 'News Room'}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
