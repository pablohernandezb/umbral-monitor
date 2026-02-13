'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/lib/cookie-consent'

interface GoogleAnalyticsProps {
  gaId: string
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  const { hasConsent } = useCookieConsent()

  // Only load GA if user has explicitly consented
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
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
