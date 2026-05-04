import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between px-6 py-4
                      border-b border-gray-100 bg-white">
        <Link href="/home" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center
                          justify-center">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <span className="text-base font-bold tracking-widest">PAYLAW</span>
        </Link>
        <Link href="/login"
          className="text-sm text-gray-500 hover:text-gray-900">
          Sign in →
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white border border-gray-100 rounded-xl p-6
                        md:p-10 flex flex-col gap-6">

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Privacy Policy
            </h1>
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

          {[
            {
              title: '1. What we collect',
              body: 'PayLaw collects only the information you enter yourself. This includes your email address, your name, employee names and job titles, site names, attendance records, day rates, overtime hours, and salary amounts. We do not collect any other personal data.',
            },
            {
              title: '2. How we use your data',
              body: 'Your data is used only to run the PayLaw application. We use it to calculate salaries, generate PDF paylaw sheets, and display summaries. We do not sell, share, or transfer your data to any third party for any purpose.',
            },
            {
              title: '3. Data storage',
              body: 'All data is stored in a secure PostgreSQL database. Data is encrypted at rest and in transit using industry-standard TLS encryption.',
            },
            {
              title: '4. Data access',
              body: 'Only you can access your data. Each account is completely separate. PayLaw uses secure session tokens to ensure no one else can view your paylaws, employees, or records.',
            },
            {
              title: '5. PDF documents',
              body: 'PDF files are generated entirely in your browser. They are never uploaded to any server. The PDF is created on your device and downloaded directly to your device.',
            },
            {
              title: '6. Cookies and sessions',
              body: 'PayLaw uses a single secure session cookie to keep you logged in. This cookie contains only a session token. No tracking cookies, analytics cookies, or advertising cookies are used.',
            },
            {
              title: '7. Your rights',
              body: 'You can delete any record in the app at any time. If you want all your data deleted permanently, contact the administrator. All your data will be removed from the database within 7 days.',
            },
            {
              title: '8. Changes to this policy',
              body: 'If this privacy policy changes, the updated date at the top of this page will reflect that.',
            },
          ].map((section, i) => (
            <section key={i} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-gray-900 uppercase
                             tracking-wide">
                {section.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}

          <div className="border-t border-gray-100 pt-4">
            <Link href="/home"
              className="text-sm text-gray-500 underline underline-offset-2
                         hover:text-gray-800">
              ← Back to home
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}