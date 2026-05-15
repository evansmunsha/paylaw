import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import Link from 'next/link'
import MonthSelector from './MonthSelector'
import ExportExcelButton from '@/components/ExportExcelButton'
import MonthlyReportButton from '@/components/MonthlyReportButton'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

interface SearchParams {
  month?: string
  year?: string
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Safely await and parse searchParams
  let qMonth: string | undefined
  let qYear: string | undefined

  try {
    const sp = await searchParams
    qMonth = sp?.month
    qYear  = sp?.year
  } catch {
    // If searchParams fails just use current month
  }

  const now   = new Date()
  const month = qMonth && !isNaN(parseInt(qMonth))
    ? parseInt(qMonth)
    : now.getMonth() + 1
  const year  = qYear && !isNaN(parseInt(qYear))
    ? parseInt(qYear)
    : now.getFullYear()

  // Clamp month to valid range just in case
  const safeMonth = Math.min(Math.max(month, 1), 12)
  const safeYear  = year > 2000 && year < 2100 ? year : now.getFullYear()

  const [paylaws, overtimes, settings] = await Promise.all([
    prisma.paylaw.findMany({
      where: { userId: session.user.id, month: safeMonth, year: safeYear },
      include: {
        rows: { include: { employee: true } },
      },
    }),
    prisma.overtime.findMany({
      where: { userId: session.user.id, month: safeMonth, year: safeYear },
      include: {
        rows: { include: { employee: true } },
      },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  // ── Per worker breakdown ─────────────────────────────
  const workerMap: Record<string, {
    name: string
    jobTitle: string
    site: string
    daysWorked: number
    normalPay: number
    otHours: number
    otPay: number
  }> = {}

  for (const p of paylaws) {
    for (const row of p.rows) {
      const id = row.employeeId
      if (!workerMap[id]) {
        workerMap[id] = {
          name: row.employee.name,
          jobTitle: row.employee.jobTitle,
          site: p.site,
          daysWorked: 0,
          normalPay: 0,
          otHours: 0,
          otPay: 0,
        }
      }
      workerMap[id].daysWorked += row.daysWorked || 0
      workerMap[id].normalPay  += row.amount || 0
    }
  }

  for (const o of overtimes) {
    for (const row of o.rows) {
      const id = row.employeeId
      if (!workerMap[id]) {
        workerMap[id] = {
          name: row.employee.name,
          jobTitle: row.employee.jobTitle,
          site: o.site,
          daysWorked: 0,
          normalPay: 0,
          otHours: 0,
          otPay: 0,
        }
      }
      workerMap[id].otHours += row.totalHours || 0
      workerMap[id].otPay   += row.amount || 0
    }
  }

  const workers = Object.entries(workerMap).map(([id, data]) => ({
    id,
    ...data,
    total: (data.normalPay || 0) + (data.otPay || 0),
  })).sort((a, b) => b.total - a.total)

  // Safe max for bar chart — avoid Infinity/-Infinity
  const maxTotal = workers.length > 0
    ? Math.max(...workers.map(w => w.total), 1)
    : 1

  // ── Per site breakdown ───────────────────────────────
  const siteMap: Record<string, {
    normalPay: number
    otPay: number
    foodExpense: number
    workerCount: number
  }> = {}

  for (const p of paylaws) {
    if (!siteMap[p.site]) {
      siteMap[p.site] = {
        normalPay: 0, otPay: 0,
        foodExpense: 0, workerCount: 0,
      }
    }
    siteMap[p.site].foodExpense  += (p.foodExpense || 0) + (p.otherDeduct || 0)
    siteMap[p.site].workerCount  += p.rows.length
    for (const r of p.rows) {
      siteMap[p.site].normalPay += r.amount || 0
    }
  }

  for (const o of overtimes) {
    if (!siteMap[o.site]) {
      siteMap[o.site] = {
        normalPay: 0, otPay: 0,
        foodExpense: 0, workerCount: 0,
      }
    }
    for (const r of o.rows) {
      siteMap[o.site].otPay += r.amount || 0
    }
  }

  const sites = Object.entries(siteMap)

  // ── Grand totals ─────────────────────────────────────
  const totalNormal  = workers.reduce((t, w) => t + w.normalPay, 0)
  const totalOT      = workers.reduce((t, w) => t + w.otPay, 0)
  const totalPay     = totalNormal + totalOT
  const totalOTHours = workers.reduce((t, w) => t + w.otHours, 0)
  const totalDays    = workers.reduce((t, w) => t + w.daysWorked, 0)
  const monthName    = MONTH_NAMES[safeMonth - 1] || 'Unknown'

  // ── Month options — last 6 months ────────────────────
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    }
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Pay Summary"
        subtitle="Normal pay + overtime combined"
      />

      <div className="p-6 flex flex-col gap-5">

        <div className="flex items-center gap-3 flex-wrap">
          <MonthlyReportButton month={safeMonth} year={safeYear} />
          <ExportExcelButton
            type="monthly"
            month={safeMonth}
            year={safeYear}
            label="Export Excel"
          />
        </div>

        {/* Month selector */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-gray-600">
              Viewing:
            </label>
            <MonthSelector
              options={monthOptions}
              currentMonth={safeMonth}
              currentYear={safeYear}
            />
            <span className="text-sm text-gray-400">
              · All sites combined
            </span>
          </div>
        </div>

        {/* YTD link */}
        <div className="flex justify-end">
          <Link
            href={`/summary/ytd?year=${new Date().getFullYear()}`}
            className="flex items-center gap-2 text-sm border border-gray-200
                      px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50
                      transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="8" width="3" height="5" rx="1" fill="currentColor"/>
              <rect x="5.5" y="5" width="3" height="8" rx="1" fill="currentColor"/>
              <rect x="10" y="2" width="3" height="11" rx="1" fill="currentColor"/>
            </svg>
            View year-to-date →
          </Link>
        </div>

        {/* 3 stat cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-green-600">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-1">
              Normal pay
              <span className="ml-2 text-xs font-medium bg-green-50
                               text-green-700 border border-green-100
                               px-2 py-0.5 rounded normal-case tracking-normal">
                per day
              </span>
            </p>
            <p className="text-3xl font-semibold text-green-700 mt-2">
              {formatMoney(totalNormal, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {paylaws.length} paylaw{paylaws.length !== 1 ? 's' : ''}
              · {totalDays} days worked
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-amber-500">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-1">
              Overtime pay
              <span className="ml-2 text-xs font-medium bg-amber-50
                               text-amber-700 border border-amber-100
                               px-2 py-0.5 rounded normal-case tracking-normal">
                per hour
              </span>
            </p>
            <p className="text-3xl font-semibold text-amber-700 mt-2">
              {formatMoney(totalOT, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {overtimes.length} OT sheet{overtimes.length !== 1 ? 's' : ''}
              · {totalOTHours} total hours
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-gray-300">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-1">
              Total payout
            </p>
            <p className="text-3xl font-semibold text-gray-900 mt-2">
              {formatMoney(totalPay, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Normal + overtime · {monthName} {safeYear}
            </p>
          </div>

        </div>

        {/* Bar chart — only shows if there is data */}
        {workers.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase
                          tracking-wider mb-1 flex items-center gap-3
                          after:flex-1 after:h-px after:bg-gray-100
                          after:content-['']">
              Pay per worker
            </p>

            <div className="flex items-center gap-4 mb-4 text-xs
                            text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-400 inline-block"/>
                Normal pay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block"/>
                Overtime pay
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {workers.map(w => {
                // Safe percentage — never negative or NaN
                const normalPct = maxTotal > 0
                  ? Math.max((w.normalPay / maxTotal) * 100, 0)
                  : 0
                const otPct = maxTotal > 0
                  ? Math.max((w.otPay / maxTotal) * 100, 0)
                  : 0

                return (
                  <div key={w.id} className="flex items-center gap-3">
                    <div className="w-28 flex-shrink-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {w.name}
                      </p>
                      <p className="text-xs text-gray-400">{w.jobTitle}</p>
                    </div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-md
                                   overflow-hidden flex min-w-0">
                      {w.normalPay > 0 && (
                        <div
                          className="h-full bg-green-400 rounded-l-md
                                     transition-all flex-shrink-0"
                          style={{ width: `${normalPct}%` }}
                        />
                      )}
                      {w.otPay > 0 && (
                        <div
                          className="h-full bg-amber-400 transition-all
                                     flex-shrink-0"
                          style={{ width: `${otPct}%` }}
                        />
                      )}
                    </div>
                    <div className="w-24 text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-gray-900">
                        {formatMoney(w.total, settings?.currency || 'ZMW')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Per worker table */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              Per-worker breakdown
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {monthName} {safeYear} · all sites
            </p>
          </div>

          {workers.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-gray-400">
                No data for {monthName} {safeYear} yet.
              </p>
              <div className="flex gap-3 justify-center mt-3">
                <Link
                  href="/paylaws/new"
                  className="text-sm underline text-gray-500
                             hover:text-gray-800"
                >
                  Create a paylaw
                </Link>
                <span className="text-gray-300">·</span>
                <Link
                  href="/overtime/new"
                  className="text-sm underline text-gray-500
                             hover:text-gray-800"
                >
                  Create an OT sheet
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      Name
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      Job
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      Site
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      Days
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      Normal pay
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      OT hrs
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      OT pay
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(w => (
                    <tr
                      key={w.id}
                      className="border-b border-gray-50
                                 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-gray-900
                                     whitespace-nowrap">
                        {w.name}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {w.jobTitle}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {w.site}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {w.daysWorked} days
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold
                                     text-green-700 whitespace-nowrap">
                        {formatMoney(w.normalPay, settings?.currency || 'ZMW')}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {w.otHours > 0 ? `${w.otHours} hrs` : '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold
                                     text-amber-700 whitespace-nowrap">
                        {w.otPay > 0 ? formatMoney(w.otPay, settings?.currency || 'ZMW') : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold
                                     text-gray-900 whitespace-nowrap">
                        {formatMoney(w.total, settings?.currency || 'ZMW')}
                      </td>
                    </tr>
                  ))}

                  {/* Grand total row */}
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td
                      className="px-5 py-3 text-sm font-bold text-gray-900"
                      colSpan={3}
                    >
                      Total — {monthName} {safeYear}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-700
                                   whitespace-nowrap">
                      {totalDays} days
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-green-700
                                   whitespace-nowrap">
                      {formatMoney(totalNormal, settings?.currency || 'ZMW')}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-700
                                   whitespace-nowrap">
                      {totalOTHours > 0 ? `${totalOTHours} hrs` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-amber-700
                                   whitespace-nowrap">
                      {totalOT > 0 ? formatMoney(totalOT, settings?.currency || 'ZMW') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-base font-bold
                                   text-gray-900 whitespace-nowrap">
                      {formatMoney(totalPay, settings?.currency || 'ZMW')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Per site cards */}
        {sites.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sites.map(([siteName, data]) => (
              <div
                key={siteName}
                className="bg-white border border-gray-100 rounded-xl p-5"
              >
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {siteName}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {data.workerCount} worker{data.workerCount !== 1 ? 's' : ''}
                  · {monthName} {safeYear}
                </p>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-2.5
                                  border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Normal pay</span>
                    <span className="font-semibold text-green-700">
                      {formatMoney(data.normalPay, settings?.currency || 'ZMW')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5
                                  border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Overtime pay</span>
                    <span className="font-semibold text-amber-700">
                      {formatMoney(data.otPay, settings?.currency || 'ZMW')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5
                                  border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Food &amp; deductions</span>
                    <span className="font-medium text-gray-700">
                      {formatMoney(data.foodExpense, settings?.currency || 'ZMW')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 text-sm">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatMoney(
                        data.normalPay + data.otPay + data.foodExpense,
                        settings?.currency || 'ZMW'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}