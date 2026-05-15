import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMoney, getCurrencySymbol } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthName = now.toLocaleString('default', { month: 'long' })
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [paylaws, overtimes, employees, settings] = await Promise.all([
    prisma.paylaw.findMany({
      where: { userId: session.user.id, month, year },
      include: { rows: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.overtime.findMany({
      where: { userId: session.user.id, month, year },
      include: { rows: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.findMany({
      where: { userId: session.user.id, active: true },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  // ── Totals ──────────────────────────────────────────
  const normalPay = paylaws.reduce(
    (t, p) => t + p.rows.reduce((s, r) => s + r.amount, 0), 0
  )
  const otPay = overtimes.reduce(
    (t, o) => t + o.rows.reduce((s, r) => s + r.amount, 0), 0
  )
  const totalPay = normalPay + otPay
  const currency = settings?.currency || 'ZMW'
  const currencySymbol = getCurrencySymbol(currency)

  // ── This week strip ──────────────────────────────────
  // Build Mon–Sun for the current week
  const todayIndex = now.getDay() // 0=Sun 1=Mon...6=Sat
  // We want Monday as first day so we shift
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((todayIndex + 6) % 7))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const isWeekend = (i: number) => i === 5 || i === 6 // Sat Sun

  // ── Sites overview ───────────────────────────────────
  // Group paylaws and overtimes by site
  const siteMap: Record<string, { normalPay: number; otPay: number; workers: Set<string> }> = {}

  paylaws.forEach(p => {
    if (!siteMap[p.site]) siteMap[p.site] = { normalPay: 0, otPay: 0, workers: new Set() }
    p.rows.forEach(r => {
      siteMap[p.site].normalPay += r.amount
      siteMap[p.site].workers.add(r.employeeId)
    })
  })

  overtimes.forEach(o => {
    if (!siteMap[o.site]) siteMap[o.site] = { normalPay: 0, otPay: 0, workers: new Set() }
    o.rows.forEach(r => {
      siteMap[o.site].otPay += r.amount
    })
  })

  const sites = Object.entries(siteMap)

  // After the session check add this
  const isForeman = session.user.role === 'foreman'
  const foremanSite = session.user.site

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Dashboard"
        subtitle={`${monthName} ${year} · ${employees.length} active workers`}
      />

      <div className="p-6 flex flex-col gap-6">

        {/* ── Greeting ── */}

          {isForeman && foremanSite && (
            <div className="inline-flex items-center gap-2 bg-blue-50 border
                            border-blue-100 rounded-lg px-3 py-1.5 text-xs
                            text-blue-700 mt-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M1.5 10.5C1.5 8.015 3.515 6 6 6s4.5 2.015 4.5 4.5"
                      stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
              </svg>
              Your site: <strong>{foremanSite}</strong>
            </div>
          )}


        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {greeting} {session.user.name?.split(' ')[0] ?? ''} 👷
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Here is what is happening on your sites this month
          </p>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-gray-900">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-3">
              Active Workers
            </p>
            <p className="text-3xl font-semibold text-gray-900">
              {employees.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This period
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-green-600">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-3">
              Normal Pay — {monthName}
            </p>
            <p className="text-3xl font-semibold text-green-700">
              {formatMoney(normalPay, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {paylaws.length} paylaw{paylaws.length !== 1 ? 's' : ''} · per day rate
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-amber-500">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-3">
              Overtime Pay — {monthName}
            </p>
            <p className="text-3xl font-semibold text-amber-700">
              {formatMoney(otPay, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {overtimes.length} OT sheet{overtimes.length !== 1 ? 's' : ''} · per hour rate
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-gray-300">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-3">
              Total Payout — {monthName}
            </p>
            <p className="text-3xl font-semibold text-gray-900">
              {formatMoney(totalPay, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Normal + overtime combined
            </p>
          </div>
        </div>

        {/* ── Month selector + Quick action buttons ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">
              Viewing month:
            </label>
            {/* 
              This is a display-only selector for now.
              In a future step we will make it filter the data.
            */}
            <select className="border border-gray-200 rounded-lg px-3 py-2
                               text-sm text-gray-900 outline-none bg-white
                               focus:border-gray-400">
              <option>{monthName} {year}</option>
            </select>
          </div>

          <div className="flex gap-3 ml-auto">
            <Link
              href="/paylaws/new"
              className="flex items-center gap-2 bg-black text-white text-sm
                         font-medium px-4 py-2 rounded-lg hover:bg-gray-800
                         transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              New Paylaw
            </Link>
            <Link
              href="/overtime/new"
              className="flex items-center gap-2 bg-amber-50 border border-amber-200
                         text-amber-800 text-sm font-medium px-4 py-2 rounded-lg
                         hover:bg-amber-100 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              New OT Sheet
            </Link>
          </div>
        </div>

        {/* ── This week strip ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">This week</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {weekDays[0].toLocaleDateString('default', { day: 'numeric', month: 'short' })}
              {' – '}
              {weekDays[6].toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="grid grid-cols-7 gap-2 p-4">
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === now.toDateString()
              const weekend = isWeekend(i)

              return (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-center flex flex-col items-center gap-1
                    ${isToday
                      ? 'bg-green-50 border border-green-200'
                      : weekend
                      ? 'bg-amber-50/40 border border-amber-100'
                      : 'bg-gray-50 border border-gray-100'
                    }`}
                >
                  <p className={`text-xs font-medium uppercase tracking-wide
                    ${isToday ? 'text-green-700' : weekend ? 'text-amber-600' : 'text-gray-400'}`}>
                    {dayNames[i]}
                  </p>
                  <p className={`text-lg font-semibold leading-none
                    ${isToday ? 'text-green-700' : 'text-gray-700'}`}>
                    {day.getDate()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isToday ? 'Today' : weekend ? 'Off' : '—'}
                  </p>
                  {/* Dot indicator */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5
                    ${isToday ? 'bg-green-500' : 'bg-gray-200'}`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Recent Paylaws + Recent OT side by side ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Recent Paylaws */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Recent Paylaws</p>
                <p className="text-xs text-gray-400">Normal shift · per day</p>
              </div>
              <Link href="/paylaws"
                className="text-xs text-gray-400 underline underline-offset-2
                           hover:text-gray-700">
                View all →
              </Link>
            </div>

            {paylaws.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400">No paylaws this month.</p>
                <Link href="/paylaws/new"
                  className="text-sm underline text-gray-500 hover:text-gray-800 mt-1 inline-block">
                  Create one
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Site</th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Rate</th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Total</th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paylaws.slice(0, 4).map(p => {
                    const total = p.rows.reduce((t, r) => t + r.amount, 0)
                    return (
                      <tr key={p.id} className="border-b border-gray-50
                                                hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {p.site}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-medium bg-green-50
                                           text-green-700 border border-green-100
                                           px-2 py-0.5 rounded">
                            {currencySymbol}/day
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-green-700">
                          {formatMoney(total, currency)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                            ${p.status === 'done'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'}`}>
                            {p.status === 'done' ? 'Done' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Overtime */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Recent Overtime</p>
                <p className="text-xs text-gray-400">Extra hours · per hour</p>
              </div>
              <Link href="/overtime"
                className="text-xs text-gray-400 underline underline-offset-2
                           hover:text-gray-700">
                View all →
              </Link>
            </div>

            {overtimes.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400">No overtime sheets this month.</p>
                <Link href="/overtime/new"
                  className="text-sm underline text-gray-500 hover:text-gray-800 mt-1 inline-block">
                  Create one
                </Link>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Site</th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Rate</th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">OT Total</th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {overtimes.slice(0, 4).map(o => {
                    const total = o.rows.reduce((t, r) => t + r.amount, 0)
                    return (
                      <tr key={o.id} className="border-b border-gray-50
                                                hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">
                          {o.site}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-medium bg-amber-50
                                           text-amber-700 border border-amber-100
                                           px-2 py-0.5 rounded">
                            {currencySymbol}/hr
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm font-semibold text-amber-700">
                          {formatMoney(total, currency)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                            ${o.status === 'done'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'}`}>
                            {o.status === 'done' ? 'Done' : 'Draft'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Sites overview table ── */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              Sites overview — {monthName} {year}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Normal pay + overtime per site
            </p>
          </div>

          {sites.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-400">
              No data yet this month
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3">Site</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3">Workers</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3">Normal Pay</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3">OT Pay</th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(([site, data]) => (
                  <tr key={site} className="border-b border-gray-50
                                            hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {site}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {data.workers.size}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-green-700">
                      {formatMoney(data.normalPay, currency)}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-amber-700">
                      {formatMoney(data.otPay, currency)}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">
                      {formatMoney(data.normalPay + data.otPay, currency)}
                    </td>
                  </tr>
                ))}

                {/* Grand total row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">
                    {employees.length}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-green-700">
                    {formatMoney(normalPay, currency)}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-amber-700">
                    {formatMoney(otPay, currency)}
                  </td>
                  <td className="px-5 py-3 text-base font-bold text-gray-900">
                    {formatMoney(totalPay, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}