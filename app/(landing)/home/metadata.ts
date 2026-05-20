import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app'
const pageUrl = new URL('/', siteUrl).toString()

export const metadata: Metadata = {
  title: 'PayLaw — Construction Payroll for Site Managers',
  description:
    'Mark attendance, track overtime, and generate PDF payslips for construction teams — all from your phone.',
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: pageUrl,
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
