import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5
                      border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center
                          justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <span className="text-lg font-bold tracking-widest text-gray-900">
            PAYLAW
          </span>
        </div>
        <Link
          href="/login"
          className="bg-black text-white text-sm font-medium px-5 py-2.5
                     rounded-lg hover:bg-gray-800 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center text-center px-6
                          pt-16 md:pt-24 pb-12 md:pb-20">
        <div className="inline-flex items-center gap-2 bg-green-50 border
                        border-green-100 rounded-full px-4 py-1.5 text-xs
                        font-medium text-green-700 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>
          Built for Zambian construction sites
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-gray-900
                       leading-tight max-w-3xl mb-6">
          Payroll made simple for{' '}
          <span className="text-green-600">site managers</span>
        </h1>

        <p className="text-base md:text-lg text-gray-500 max-w-xl mb-8
                      leading-relaxed">
          Mark monthly attendance, track overtime hours, calculate salaries
          automatically and download a clean PDF — all in one place.
          No spreadsheets. No maths errors.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
  <Link
    href="/login"
    className="bg-black text-white text-sm font-medium px-6 py-3
               rounded-lg hover:bg-gray-800 transition-colors"
  >
    Get started →
  </Link>

  <a
    href="#how-it-works"
    className="border border-gray-200 text-gray-700 text-sm
               font-medium px-6 py-3 rounded-lg hover:bg-gray-50
                transition-colors"
    >
        See how it works
    </a>
</div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <section id="how-it-works"
               className="px-6 md:px-16 py-12 md:py-16 bg-gray-50
                          border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-widest text-center mb-3">
            How it works
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900
                         text-center mb-8">
            From attendance to payslip in minutes
          </h2>

          {/* Video placeholder — replace src with your real video */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden
                          aspect-video flex items-center justify-center
                          relative shadow-2xl">
            {/* 
              To add a real video:
              Replace this div with:
              <video controls poster="/video-thumbnail.png" className="w-full h-full">
                <source src="/paylaw-demo.mp4" type="video/mp4"/>
              </video>

              Or for YouTube:
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                allowFullScreen
              />
            */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center
                              justify-center mx-auto mb-4 cursor-pointer
                              hover:bg-white/20 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <p className="text-white/60 text-sm">
                Demo video coming soon
              </p>
              
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 md:px-16 py-12 md:py-16">
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

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex
                              items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="2" width="14" height="16" rx="2"
                        stroke="#16a34a" strokeWidth="1.5"/>
                  <line x1="7" y1="7" x2="13" y2="7" stroke="#16a34a"
                        strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="7" y1="10" x2="13" y2="10" stroke="#16a34a"
                        strokeWidth="1.3" strokeLinecap="round"/>
                  <line x1="7" y1="13" x2="10" y2="13" stroke="#16a34a"
                        strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Monthly attendance grid
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Click each day to mark a worker present or absent.
                The grid shows all 30 or 31 days at once.
                Weekends are highlighted automatically.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex
                              items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#d97706" strokeWidth="1.5"/>
                  <path d="M10 6V10.5L12.5 13" stroke="#d97706"
                        strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Overtime tracking
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Enter overtime hours per day per worker.
                Normal pay and overtime are kept completely separate
                so your records are always clean and auditable.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex
                              items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 14h12M10 4v8M7 9l3 3 3-3"
                        stroke="#374151" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                PDF payslips
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Download a professional PDF paylaw with one click.
                Shows all workers, attendance, amounts, and signature fields.
                Ready to print and hand to your workers.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex
                              items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="10" width="4" height="8" rx="1"
                        fill="#3b82f6" opacity=".4"/>
                  <rect x="8" y="6" width="4" height="12" rx="1"
                        fill="#3b82f6" opacity=".7"/>
                  <rect x="14" y="2" width="4" height="16" rx="1"
                        fill="#3b82f6"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Pay summary
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                See a full breakdown of normal pay plus overtime
                per worker and per site. Visual bar chart makes
                it easy to see who earned the most.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex
                              items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z"
                        stroke="#7c3aed" strokeWidth="1.5"/>
                  <path d="M6 10l3 3 5-5" stroke="#7c3aed"
                        strokeWidth="1.5" strokeLinecap="round"
                        strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Save and continue
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Save a draft and come back the next day to keep marking.
                Your attendance is saved exactly as you left it.
                No data is lost.
              </p>
            </div>

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex
                              items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="3" width="14" height="14" rx="3"
                        stroke="white" strokeWidth="1.5"/>
                  <path d="M7 10h6M10 7v6" stroke="white"
                        strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Works on any device
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Install PayLaw on your phone, tablet, or computer.
                Works like a real app — no browser needed after install.
                Even works offline when there is no internet.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── PDF PREVIEW SECTION ── */}
      <section className="px-6 md:px-16 py-12 md:py-16 bg-gray-50
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
                        ['J. Banda', '✓','✓','✓','✓','✓', '22', 'K 1,980'],
                        ['P. Mwale', '✓','✓','–','✓','✓', '18', 'K 1,440'],
                        ['G. Phiri', '✓','✓','✓','–','✓', '20', 'K 2,400'],
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
                          K 5,820
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Salaries: <span className="font-bold text-gray-900">K 5,820</span></p>
                    <p className="text-gray-500 mt-1">Food expense: <span className="font-bold">K 200</span></p>
                    <p className="text-gray-500 mt-1">Total spent: <span className="font-bold text-gray-900">K 6,020</span></p>
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
                        ['J. Banda',  '2','0','3','2','1','12h','K 360'],
                        ['P. Mwale',  '0','2','0','3','0','8h', 'K 224'],
                        ['G. Phiri',  '3','3','0','3','3','16h','K 720'],
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
                          K 1,304
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-500">Total OT hours: <span className="font-bold text-gray-900">36 hrs</span></p>
                    <p className="text-gray-500 mt-1">Total OT payout: <span className="font-bold text-amber-700">K 1,304</span></p>
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

      {/* ── HOW IT WORKS STEPS ── */}
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
                title: 'Add your workers',
                desc: 'Enter each worker\'s name, job title, day rate and overtime rate once. They are saved and reused every month.',
                color: 'bg-green-50 text-green-700 border-green-100',
              },
              {
                step: '02',
                title: 'Mark attendance daily',
                desc: 'Open the paylaw and click each day to mark workers present or absent. Save a draft and come back tomorrow.',
                color: 'bg-blue-50 text-blue-700 border-blue-100',
              },
              {
                step: '03',
                title: 'Record overtime hours',
                desc: 'On the overtime sheet type how many extra hours each worker did per day. Separate from normal pay.',
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
                <div className={`w-12 h-12 rounded-xl border flex items-center
                                 justify-center flex-shrink-0 font-bold text-sm
                                 ${item.color}`}>
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

      {/* ── CTA ── */}
      <section className="px-6 md:px-16 py-12 md:py-16 bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to stop using paper?
          </h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            PayLaw replaces your handwritten paylaw sheets with a fast,
            accurate digital system. Install it on your phone and use it
            anywhere — even without internet.
          </p>
          <Link
            href="/login"
            className="bg-white text-gray-900 text-sm font-semibold
                       px-8 py-3.5 rounded-lg hover:bg-gray-100
                       transition-colors inline-block"
          >
            Sign in to PayLaw →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-16 py-6 border-t border-gray-100
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
          <Link href="/privacy"
            className="text-xs text-gray-400 hover:text-gray-700">
            Privacy Policy
          </Link>
          <Link href="/login"
            className="text-xs text-gray-400 hover:text-gray-700">
            Sign in
          </Link>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} PayLaw. Built for Zambia 🇿🇲
        </p>
      </footer>

    </div>
  )
}