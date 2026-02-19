'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useCookieConsent } from '@/lib/cookie-consent'

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  const { hasConsent } = useCookieConsent()
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    if (!gaId || hasConsent !== true) return
    // Skip first render — the inline script handles the initial pageview
    if (isFirst.current) { isFirst.current = false; return }
    if (pathname.startsWith('/admin')) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gtag?.('config', gaId, { page_path: pathname })
  }, [pathname, gaId, hasConsent])

  if (!gaId || hasConsent !== true) return null

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            if (!window.location.pathname.startsWith('/admin')) {
              gtag('config', '${gaId}', { page_path: window.location.pathname });
            }
          `,
        }}
      />
    </>
  )
}
