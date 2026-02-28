'use client'

import Link from 'next/link'
import { Github, X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import CookiePreferences from '@/components/CookiePreferences'

const CustomGradientIcon = ({ className = "w-5 h-5" }) => (
  <img 
    src="/images/icon_transparent.svg" 
    className={className} 
    alt="" 
    aria-hidden="true" 
  />
  );

export function Footer() {
  const { t, locale } = useTranslation()

  return (
    <footer className="bg-umbral-charcoal border-t border-umbral-ash">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-umbral-ash/10 border border-umbral-ash/80 flex items-center justify-center group-hover:bg-signal-teal/20 transition-colors">
                <CustomGradientIcon className="w-6 h-6" />
              </div>
              <span className="text-lg font-bold text-white font-display">
                Umbral
              </span>
            </Link>
            <p className="text-sm text-umbral-muted max-w-md">
              {t('footer.disclaimer')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">{t('footer.resources')}</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/participate" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('footer.participate')}
                </Link>
              </li>
              <li>
                <Link href="/#scenarios" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('footer.monitor')}
                </Link>
              </li>
              <li>
                <Link href="/how-did-we-get-here" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('footer.howDidWeGetHere')}
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('nav.newsRoom')}
                </Link>
              </li>
              <li>
                <Link href="/reading-room" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('nav.readingRoom')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-terms" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {locale === 'es' ? 'Privacidad y Términos' : 'Privacy and Terms'}
                </Link>
              </li>
              <li>
                <CookiePreferences />
              </li>
              <li>
                <a href="https://buymeacoffee.com/pablohernandezb" target="_blank" rel="noopener noreferrer" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('footer.support')}
                </a>
              </li>
              <li>
                <a href="/about#contact" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('footer.contact')}
                </a>
              </li>
              <li>
                <Link href="/about" className="text-sm text-umbral-muted hover:text-signal-teal transition-colors">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-umbral-ash flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-umbral-muted">
            © {new Date().getFullYear()} {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/pablohernandezb/umbral-monitor"
              target="_blank"
              rel="noopener noreferrer"
              className="text-umbral-muted hover:text-signal-teal transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="text-umbral-muted hover:text-signal-teal transition-colors"
              aria-label="X"
            >
              <X className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
