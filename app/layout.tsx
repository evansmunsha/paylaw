import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'PayLaw — Construction Payroll',
  description: 'Manage your site workers, paylaws and overtime',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PayLaw',
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
        {/* iOS home screen icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png"/>
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}