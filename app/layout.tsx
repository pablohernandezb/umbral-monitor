import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { I18nProvider } from '@/i18n'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Umbral | Monitor de Transformación de Régimen',
    template: '%s | Umbral',
  },
  description: 'Plataforma analítica independiente que monitorea las dinámicas de transformación de régimen en Venezuela.',
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
    locale: 'es_VE',
    alternateLocale: 'en_US',
    siteName: 'Umbral',
    title: 'Umbral | Monitor de Transformación de Régimen',
    description: 'Plataforma analítica independiente que monitorea las dinámicas de transformación de régimen en Venezuela.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Umbral - Monitor de Transformación de Régimen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Umbral | Monitor de Transformación de Régimen',
    description: 'Plataforma analítica independiente que monitorea las dinámicas de transformación de régimen en Venezuela.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <Suspense fallback={null}>
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
        </Suspense>
      </body>
    </html>
  )
}
