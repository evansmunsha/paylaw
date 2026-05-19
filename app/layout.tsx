import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import InstallPrompt from '@/components/InstallPrompt'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app'
const siteTitle = 'PayLaw — Construction Payroll'
const siteDescription = 'Run construction payroll, attendance, overtime and PDF payslips from your phone.'
const siteImage = `${siteUrl}/api/og/landing`

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PayLaw',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'PayLaw',
    type: 'website',
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: 'PayLaw sample PDF preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [siteImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA metadata */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-title" content="PayLaw" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'PayLaw',
              url: siteUrl,
              logo: `${siteUrl}/icons/icon-512x512.png`,
              sameAs: [],
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  )
}