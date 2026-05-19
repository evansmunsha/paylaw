import Link from 'next/link'

const plans = [
  {
    name:    'Free',
    price:   { monthly: 0, yearly: 0 },
    desc:    'Perfect for trying PayLaw',
    color:   'border-gray-200',
    badge:   null,
    features: [
      '1 site',
      'Up to 10 workers',
      '3 paylaws per month',
      'PDF download',
      'Basic attendance grid',
    ],
    limits: [
      'No overtime sheets',
      'No foreman accounts',
      'No reports or Excel export',
    ],
    cta:   'Get started free',
    href:  '/register',
    style: 'border border-gray-200 text-gray-900 hover:bg-gray-50',
  },
  {
    name:  'Starter',
    price: { monthly: 9, yearly: 90 },
    desc:  'For small construction companies',
    color: 'border-green-500',
    badge: 'Most popular',
    features: [
      '3 sites',
      'Up to 50 workers',
      'Unlimited paylaws',
      'Overtime sheets',
      '1 foreman account',
      'Monthly & YTD reports',
      'Excel export',
      'Pay slips per worker',
    ],
    limits: [],
    cta:   'Start Starter',
    href:  '/register?plan=starter',
    style: 'bg-black text-white hover:bg-gray-800',
  },
  {
    name:  'Pro',
    price: { monthly: 19, yearly: 190 },
    desc:  'For growing companies with multiple sites',
    color: 'border-blue-500',
    badge: 'Best value',
    features: [
      'Unlimited sites',
      'Unlimited workers',
      'Unlimited paylaws',
      'Unlimited foreman accounts',
      'Full approval workflow',
      'Audit log',
      'All reports & exports',
      'Priority support',
    ],
    limits: [],
    cta:   'Start Pro',
    href:  '/register?plan=pro',
    style: 'bg-blue-600 text-white hover:bg-blue-700',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-gray-100">
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <span className="text-lg font-bold tracking-widest">PAYLAW</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800">
            Sign in
          </Link>
          <Link href="/register" className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800">
            Get started free
          </Link>
        </div>
      </nav>

      <div className="px-6 md:px-16 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Pricing
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, honest pricing
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Start free. Upgrade when you need more. Cancel any time — no contracts.
          </p>
          <div className="inline-flex items-center gap-2 mt-6 bg-green-50 border border-green-100 rounded-full px-4 py-2 text-sm text-green-700">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Pay yearly and save 2 months free
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-2xl border-2 p-6 flex flex-col ${plan.color} ${plan.name === 'Starter' ? 'shadow-xl scale-105' : ''}`}>
              {plan.badge && (
                <div className="inline-flex self-start mb-3">
                  <span className="text-xs font-bold bg-green-500 text-white px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
              <div className="mb-6">
                {plan.price.monthly === 0 ? (
                  <p className="text-4xl font-bold text-gray-900">Free</p>
                ) : (
                  <div>
                    <p className="text-4xl font-bold text-gray-900">
                      ${plan.price.monthly}
                      <span className="text-base font-normal text-gray-400">/month</span>
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      or ${plan.price.yearly}/year
                      <span className="ml-1 text-xs bg-green-50 border border-green-200 px-1.5 py-0.5 rounded text-green-700 font-medium">
                        Save ${(plan.price.monthly * 12) - plan.price.yearly}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <Link href={plan.href} className={`w-full text-center text-sm font-semibold py-3 rounded-xl transition-colors mb-6 ${plan.style}`}>
                {plan.cta}
              </Link>
              <div className="flex flex-col gap-2 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="7" cy="7" r="6.5" fill="#16a34a"/>
                      <path d="M4 7l2.5 2.5L10 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
                {plan.limits.map(l => (
                  <div key={l} className="flex items-start gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                      <circle cx="7" cy="7" r="6.5" fill="#e5e7eb"/>
                      <path d="M4.5 7h5" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm text-gray-400">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Common questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                q: 'Can I cancel any time?',
                a: 'Yes. Cancel any time from your billing page. You keep access until the end of your paid period.',
              },
              {
                q: 'Do I need a credit card to start?',
                a: 'No. The free plan requires no payment details at all.',
              },
              {
                q: 'Can I change my plan later?',
                a: 'Yes. Upgrade or downgrade any time. Changes take effect immediately.',
              },
              {
                q: 'What currencies do you support?',
                a: 'PayLaw supports ZMW, USD, EUR, GBP, ZAR, NGN and KES. More on request.',
              },
              {
                q: 'Is my data safe?',
                a: 'Yes. Each company account is completely separate. We never share your data.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes. If you are unhappy in the first 7 days we will give you a full refund.',
              },
            ].map(item => (
              <div key={item.q} className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-900 mb-2">{item.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="px-6 md:px-16 py-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <Link href="/home" className="text-sm font-bold tracking-widest text-gray-900">PAYLAW</Link>
        <div className="flex gap-6">
          <Link href="/home" className="text-xs text-gray-400 hover:text-gray-700">Home</Link>
          <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-700">Privacy</Link>
          <Link href="/login" className="text-xs text-gray-400 hover:text-gray-700">Sign in</Link>
        </div>
      </footer>
    </div>
  )
}
