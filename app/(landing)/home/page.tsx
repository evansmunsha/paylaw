import Link from 'next/link'
import ShareButton from '@/components/ShareButton'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── NAV ── */}
      <nav className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:px-16
                      py-4 sm:py-5 border-b border-gray-100 sticky top-0
                      bg-white z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center
                          justify-center shrink-0">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <span className="text-lg font-bold tracking-widest text-gray-900">
            PAYLAW
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          <Link
            href="/pricing"
            className="text-sm text-gray-500 hover:text-gray-800
                       transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-800
                       transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-black text-white text-sm font-medium px-4 py-2
                       rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center text-center px-4 sm:px-6
              pt-12 sm:pt-16 md:pt-24 pb-10 sm:pb-12 md:pb-20">
        <div className="inline-flex items-center gap-2 bg-green-50 border
                        border-green-100 rounded-full px-4 py-1.5 text-xs
                        font-medium text-green-700 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500
                           inline-block"/>
          Simple payroll for construction companies worldwide
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900
                 leading-tight max-w-3xl mb-6">
          Payroll made simple for{' '}
          <span className="text-green-600">site managers</span>
        </h1>

        <p className="text-base md:text-lg text-gray-500 max-w-xl mb-8
                      leading-relaxed">
          Mark monthly attendance, track overtime, calculate salaries
          automatically and download a clean PDF — in any currency.
          No spreadsheets. No maths errors. Works on any phone.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/register"
            className="bg-black text-white text-sm font-medium px-4 sm:px-6 py-2.5 sm:py-3
                       rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create free account →
          </Link>
          <Link
            href="#how-it-works"
            className="border border-gray-200 text-gray-700 text-sm
                       font-medium px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-50
                       transition-colors"
          >
            See how it works
          </Link>
          <ShareButton
            title="PayLaw — Construction Payroll for Site Managers"
            text="Mark attendance, track overtime, and download PDF payslips with PayLaw. Free to start."
          />
        </div>

        {/* Supported currencies */}
        <div className="flex items-center gap-3 mt-8 flex-wrap justify-center">
          <span className="text-xs text-gray-400">Supports:</span>
          {[
            { flag: '🇿🇲', code: 'ZMW' },
            { flag: '🇺🇸', code: 'USD' },
            { flag: '🇬🇧', code: 'GBP' },
            { flag: '🇪🇺', code: 'EUR' },
            { flag: '🇿🇦', code: 'ZAR' },
            { flag: '🇳🇬', code: 'NGN' },
            { flag: '🇰🇪', code: 'KES' },
          ].map(c => (
            <span
              key={c.code}
              className="flex items-center gap-1 text-xs text-gray-500
                         bg-gray-50 border border-gray-100 px-2 py-1
                         rounded-full"
            >
              {c.flag} {c.code}
            </span>
          ))}
        </div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <section
        id="how-it-works"
        className="px-4 sm:px-6 md:px-16 py-12 md:py-16 bg-gray-50
                   border-y border-gray-100"
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-widest text-center mb-3">
            How it works
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900
                         text-center mb-8">
            From attendance to payslip in minutes
          </h2>

          {/* Video placeholder */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden
                          aspect-video flex items-center justify-center
                          shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex
                              items-center justify-center mx-auto mb-4
                              cursor-pointer hover:bg-white/20
                              transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24"
                     fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-white/60 text-sm">Demo video coming soon</p>
              
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-4 sm:px-6 md:px-16 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-widest text-center mb-3">
            Features
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900
                         text-center mb-10">
            Everything you need to run payroll
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20"
                       fill="none">
                    <rect x="3" y="2" width="14" height="16" rx="2"
                          stroke="#16a34a" strokeWidth="1.5"/>
                    <line x1="7" y1="7" x2="13" y2="7"
                          stroke="#16a34a" strokeWidth="1.3"
                          strokeLinecap="round"/>
                    <line x1="7" y1="10" x2="13" y2="10"
                          stroke="#16a34a" strokeWidth="1.3"
                          strokeLinecap="round"/>
                    <line x1="7" y1="13" x2="10" y2="13"
                          stroke="#16a34a" strokeWidth="1.3"
                          strokeLinecap="round"/>
                  </svg>
                ),
                bg: 'bg-green-50',
                title: 'Monthly attendance grid',
                desc: 'Click each day to mark a worker present or absent. All 30 or 31 days at once. Weekends highlighted automatically.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20"
                       fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#d97706"
                            strokeWidth="1.5"/>
                    <path d="M10 6V10.5L12.5 13" stroke="#d97706"
                          strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                bg: 'bg-amber-50',
                title: 'Overtime tracking',
                desc: 'Enter overtime hours per day per worker. Normal pay and overtime are kept separate so your records are clean.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20"
                       fill="none">
                    <path d="M4 14h12M10 4v8M7 9l3 3 3-3"
                          stroke="#374151" strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"/>
                  </svg>
                ),
                bg: 'bg-gray-100',
                title: 'PDF payslips',
                desc: 'Download professional PDF payslips with one click. Shows attendance, amounts, deductions and signature fields.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20"
                       fill="none">
                    <rect x="2" y="10" width="4" height="8" rx="1"
                          fill="#3b82f6" opacity=".4"/>
                    <rect x="8" y="6" width="4" height="12" rx="1"
                          fill="#3b82f6" opacity=".7"/>
                    <rect x="14" y="2" width="4" height="16" rx="1"
                          fill="#3b82f6"/>
                  </svg>
                ),
                bg: 'bg-blue-50',
                title: 'Pay summary',
                desc: 'Full breakdown of normal pay plus overtime per worker and per site. Visual chart makes it easy to review.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20"
                       fill="none">
                    <circle cx="10" cy="10" r="8" stroke="#7c3aed"
                            strokeWidth="1.5"/>
                    <path d="M6 10l3 3 5-5" stroke="#7c3aed"
                          strokeWidth="1.5" strokeLinecap="round"
                          strokeLinejoin="round"/>
                  </svg>
                ),
                bg: 'bg-purple-50',
                title: 'Foreman accounts',
                desc: 'Invite foremen to mark attendance for their site. You review and approve before any PDF is generated.',
              },
              {
                icon: (
                  <svg width="20" height="20" viewBox="0 0 20 20"
                       fill="none">
                    <rect x="3" y="3" width="14" height="14" rx="3"
                          stroke="#111827" strokeWidth="1.5"/>
                    <path d="M7 10h6M10 7v6" stroke="#111827"
                          strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                bg: 'bg-gray-100',
                title: 'Works on any device',
                desc: 'Install PayLaw on your phone, tablet or computer. Works like a real app — even offline when there is no internet.',
              },
            ].map((f, i) => (
              <div key={i}
                   className="border border-gray-100 rounded-xl p-5">
                <div className={`w-10 h-10 ${f.bg} rounded-lg flex
                                 items-center justify-center mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      <section className="px-4 sm:px-6 md:px-16 py-12 md:py-16 bg-gray-50
              border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-widest text-center mb-3">
            Sample documents
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900
                         text-center mb-4">
            Clean, professional PDF payslips
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">
            Every paylaw and overtime sheet downloads as a print-ready PDF
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Paylaw PDF preview */}
            <div className="bg-white rounded-2xl border border-gray-200
                            overflow-hidden shadow-sm">
              <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400"/>
                  <span className="w-3 h-3 rounded-full bg-yellow-400"/>
                  <span className="w-3 h-3 rounded-full bg-green-400"/>
                </div>
                <span className="text-white/60 text-xs ml-2">
                  Paylaw_Lusaka_Central_April_2026.pdf
                </span>
              </div>
              {/* PDF content mockup */}
              <div className="p-6 font-mono">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-gray-900 tracking-widest">
                    PAYLAW
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Site: Lusaka Central
                  </p>
                  <p className="text-xs text-gray-500">
                    Period: April 2026
                  </p>
                  <div className="border-b border-gray-300 mt-3"/>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-900 text-white">
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-1 py-1">1</th>
                        <th className="px-1 py-1">2</th>
                        <th className="px-1 py-1">3</th>
                        <th className="px-1 py-1">4</th>
                        <th className="px-1 py-1">5</th>
                        <th className="px-1 py-1">Days</th>
                        <th className="px-2 py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['J. Banda', '✓','✓','✓','✓','✓', '22', '$ 1,980'],
                        ['P. Mwale', '✓','✓','–','✓','✓', '18', '$ 1,440'],
                        ['G. Phiri', '✓','✓','✓','–','✓', '20', '$ 2,400'],
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0
                          ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1 font-medium text-gray-900
                                         border border-gray-200">
                            {row[0]}
                          </td>
                          {row.slice(1, 6).map((cell, j) => (
                            <td key={j} className={`px-1 py-1 text-center
                                                    border border-gray-200
                              ${cell === '✓'
                                ? 'text-green-700 bg-green-50'
                                : 'text-gray-300'}`}>
                              {cell}
                            </td>
                          ))}
                          <td className="px-1 py-1 text-center font-bold
                                         border border-gray-200 text-gray-900">
                            {row[6]}
                          </td>
                          <td className="px-2 py-1 text-right font-bold
                                         border border-gray-200 text-green-700">
                            {row[7]}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-2 py-1 border border-gray-200
                                       text-gray-900">
                          TOTAL
                        </td>
                        <td colSpan={5} className="border border-gray-200"/>
                        <td className="px-1 py-1 text-center border
                                       border-gray-200 text-gray-900">
                          60
                        </td>
                        <td className="px-2 py-1 text-right border
                                       border-gray-200 text-green-700">
                          $ 5,820
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Salaries: <span className="font-bold text-gray-900">$ 5,820</span></p>
                    <p className="text-gray-500 mt-1">Food expense: <span className="font-bold">$ 200</span></p>
                    <p className="text-gray-500 mt-1">Total spent: <span className="font-bold text-gray-900">$ 6,020</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Prepared by:</p>
                    <p className="font-bold text-gray-900">James Mwansa</p>
                    <div className="border-b border-gray-400 mt-4"/>
                    <p className="text-gray-400 mt-1">Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* OT PDF preview */}
            <div className="bg-white rounded-2xl border border-gray-200
                            overflow-hidden shadow-sm">
              <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400"/>
                  <span className="w-3 h-3 rounded-full bg-yellow-400"/>
                  <span className="w-3 h-3 rounded-full bg-green-400"/>
                </div>
                <span className="text-white/60 text-xs ml-2">
                  Overtime_Lusaka_Central_April_2026.pdf
                </span>
              </div>
              <div className="p-6 font-mono">
                <div className="text-center mb-4">
                  <p className="text-lg font-bold text-gray-900 tracking-widest">
                    OVERTIME SHEET
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Site: Lusaka Central
                  </p>
                  <p className="text-xs text-gray-500">
                    Period: April 2026
                  </p>
                  <div className="border-b border-gray-300 mt-3"/>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: '#78350f' }}
                          className="text-white">
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-1 py-1">1</th>
                        <th className="px-1 py-1">2</th>
                        <th className="px-1 py-1">3</th>
                        <th className="px-1 py-1">4</th>
                        <th className="px-1 py-1">5</th>
                        <th className="px-1 py-1">Hrs</th>
                        <th className="px-2 py-1 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['J. Banda',  '2','0','3','2','1','12h','$ 360'],
                        ['P. Mwale',  '0','2','0','3','0','8h', '$ 224'],
                        ['G. Phiri',  '3','3','0','3','3','16h','$ 720'],
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0
                          ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1 font-medium text-gray-900
                                         border border-gray-200">
                            {row[0]}
                          </td>
                          {row.slice(1, 6).map((cell, j) => (
                            <td key={j} className={`px-1 py-1 text-center
                                                    border border-gray-200
                              ${cell !== '0' && cell !== ''
                                ? 'text-amber-700 bg-amber-50 font-bold'
                                : 'text-gray-300'}`}>
                              {cell === '0' ? '' : cell}
                            </td>
                          ))}
                          <td className="px-1 py-1 text-center font-bold
                                         border border-gray-200 text-amber-700">
                            {row[6]}
                          </td>
                          <td className="px-2 py-1 text-right font-bold
                                         border border-gray-200 text-amber-700">
                            {row[7]}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-2 py-1 border border-gray-200
                                       text-gray-900">
                          TOTAL
                        </td>
                        <td colSpan={5} className="border border-gray-200"/>
                        <td className="px-1 py-1 text-center border
                                       border-gray-200 text-amber-700">
                          36h
                        </td>
                        <td className="px-2 py-1 text-right border
                                       border-gray-200 text-amber-700">
                          $ 1,304
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Total OT hours: <span className="font-bold text-gray-900">36 hrs</span></p>
                    <p className="text-gray-500 mt-1">Total OT payout: <span className="font-bold text-amber-700">$ 1,304</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Prepared by:</p>
                    <p className="font-bold text-gray-900">James Mwansa</p>
                    <div className="border-b border-gray-400 mt-4"/>
                    <p className="text-gray-400 mt-1">Signature</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>





      {/* ── HOW IT WORKS ── */}
      <section className="px-6 md:px-16 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-widest text-center mb-3">
            Simple process
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900
                         text-center mb-10">
            4 steps to pay your workers
          </h2>

          <div className="flex flex-col gap-6">
            {[
              {
                step: '01',
                title: 'Create your account',
                desc: 'Sign up free. Your company data is completely private and separate from everyone else\'s.',
                color: 'bg-green-50 text-green-700 border-green-100',
              },
              {
                step: '02',
                title: 'Add your workers',
                desc: 'Enter each worker\'s name, job title, day rate and overtime rate once. Saved and reused every month.',
                color: 'bg-blue-50 text-blue-700 border-blue-100',
              },
              {
                step: '03',
                title: 'Mark attendance daily',
                desc: 'Open the paylaw and click each day. Save a draft and come back tomorrow. Your marks are saved.',
                color: 'bg-amber-50 text-amber-700 border-amber-100',
              },
              {
                step: '04',
                title: 'Download and pay',
                desc: 'At the end of the month click Download PDF. Print it out, get signatures, and pay your workers.',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 items-start">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 font-bold text-sm ${item.color}`}>
                  {item.step}
                </div>
                <div className="pt-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section className="px-6 md:px-16 py-12 md:py-16 bg-gray-50
                          border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-widest mb-3">
            Who uses PayLaw
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Built for any company that pays daily workers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🏗️', label: 'Construction' },
              { emoji: '🌾', label: 'Agriculture' },
              { emoji: '🏭', label: 'Manufacturing' },
              { emoji: '🏠', label: 'Property' },
              { emoji: '🛣️', label: 'Roads & Civil' },
              { emoji: '⛏️', label: 'Mining' },
              { emoji: '🌿', label: 'Landscaping' },
              { emoji: '🔧', label: 'Engineering' },
            ].map(item => (
              <div
                key={item.label}
                className="bg-white border border-gray-100 rounded-xl
                           p-4 text-center"
              >
                <span className="text-2xl block mb-2">{item.emoji}</span>
                <span className="text-xs text-gray-600 font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 sm:px-6 md:px-16 py-12 md:py-16 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to stop using paper?
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            PayLaw replaces your handwritten paylaw sheets with a fast,
            accurate digital system. Install it on your phone and use it
            anywhere — even without internet.
            Works in any currency, for any country.
          </p>
          <Link
            href="/register"
            className="bg-white text-gray-900 text-sm font-semibold
                       px-8 py-3.5 rounded-lg hover:bg-gray-100
                       transition-colors inline-block"
          >
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-4 sm:px-6 md:px-16 py-6 border-t border-gray-100
             flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-md flex items-center
                          justify-center">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <span className="text-sm font-bold tracking-widest text-gray-900">
            PAYLAW
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Privacy Policy
          </Link>
          <Link
            href="/pricing"
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            Register
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} PayLaw.
          Built for construction teams everywhere.
        </p>
      </footer>

    </div>
  )
}