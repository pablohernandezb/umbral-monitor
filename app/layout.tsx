import type { Metadata, Viewport } from 'next'
import { I18nProvider } from '@/i18n'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}): Promise<Metadata> {
  const params = await searchParams
  const lang = params.lang === 'en' ? 'en' : 'es'

  const isEnglish = lang === 'en'

  const titles = {
    es: 'Umbral | Monitor de Transformación de Régimen',
    en: 'Umbral | Regime Transformation Monitor'
  }

  const descriptions = {
    es: 'Plataforma analítica independiente que monitorea las dinámicas de transformación de régimen en Venezuela.',
    en: 'Independent analytical platform monitoring regime transformation dynamics in Venezuela.'
  }

  const ogImages = {
    es: '/images/og_es.png',
    en: '/images/og_en.png'
  }

  const ogAlts = {
    es: 'Umbral - Monitor de Transformación de Régimen',
    en: 'Umbral - Regime Transformation Monitor'
  }

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: {
      default: titles[lang],
      template: '%s | Umbral',
    },
    description: descriptions[lang],
    keywords: ['Venezuela', 'democracia', 'régimen', 'análisis político', 'OSINT', 'V-Dem', 'transición'],
    authors: [{ name: 'Umbral Project' }],
    icons: {
      icon: [
        { url: '/images/favicon.ico', sizes: 'any' },
        { url: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/images/icon-192.png',
    },
    openGraph: {
      type: 'website',
      locale: isEnglish ? 'en_US' : 'es_VE',
      alternateLocale: isEnglish ? 'es_VE' : 'en_US',
      siteName: 'Umbral',
      title: titles[lang],
      description: descriptions[lang],
      images: [
        {
          url: ogImages[lang],
          width: 1200,
          height: 630,
          alt: ogAlts[lang],
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[lang],
      description: descriptions[lang],
      images: [ogImages[lang]],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-umbral-black text-umbral-light antialiased">
        <I18nProvider defaultLocale="es">
          {/* Background grid pattern */}
          <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none" />
          
          {/* Gradient overlay */}
          <div 
            className="fixed inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(20, 184, 166, 0.05) 0%, transparent 50%)',
            }}
          />
          
          {/* Main content */}
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </I18nProvider>
      </body>
    </html>
  )
}
