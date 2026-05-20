import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app'
const pageUrl = new URL('/', siteUrl).toString()

export const metadata: Metadata = {
  title: 'PayLaw — Construction Payroll App for Site Managers',
  description:
    'Run construction payroll, attendance, overtime and PDF payslips from any phone. PayLaw helps site managers simplify payroll, save time, and avoid manual errors.',
  keywords: [
    'construction payroll app',
    'attendance tracking',
    'overtime payroll',
    'PDF payslips',
    'site manager payroll'
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: pageUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'PayLaw — Construction Payroll for Site Managers',
    description:
      'Mark attendance, track overtime, and generate PDF payslips for construction teams — all from your phone.',
    url: pageUrl,
    type: 'website',
    siteName: 'PayLaw',
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'PayLaw social preview image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PayLaw — Construction Payroll for Site Managers',
    description:
      'Mark attendance, track overtime, and generate PDF payslips for construction teams — all from your phone.',
    images: [`${siteUrl}/opengraph-image`],
  },
}
