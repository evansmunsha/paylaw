const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app'
const screenshotUrl = `${siteUrl}/opengraph-image`

export default function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'PayLaw',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Simple payroll software for construction site managers. Mark attendance, track overtime, download PDF payslips.',
    url: siteUrl,
    screenshot: screenshotUrl,
    publisher: {
      '@type': 'Organization',
      name: 'PayLaw',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icons/icon-512x512.png`,
      },
    },
    sameAs: [siteUrl],
    offers: {
      '@type':    'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice:   '0',
      highPrice:  '19',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name:    'Free',
          price:   '0',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name:    'Starter',
          price:   '9',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name:    'Pro',
          price:   '19',
          priceCurrency: 'USD',
        },
      ],
    },
    featureList: [
      'Monthly attendance grid',
      'Overtime tracking',
      'PDF payslip generation',
      'Multi-currency support',
      'Offline support',
      'Foreman accounts',
      'Approval workflow',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}