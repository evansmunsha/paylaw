import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import Link from 'next/link'
import YTDClient from './YTDClient'
import ExportExcelButton from '@/components/ExportExcelButton'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default async function YTDPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { year: qYear } = await searchParams
  const now  = new Date()
  const year = qYear && !isNaN(parseInt(qYear))
    ? parseInt(qYear)
    : now.getFullYear()

  // Fetch ALL paylaws and overtime for this year
  const [paylaws, overtimes, settings] = await Promise.all([
    prisma.paylaw.findMany({
      where: { userId: session.user.id, year },
      include: {
        rows: { include: { employee: true } },
      },
      orderBy: { month: 'asc' },
    }),
    prisma.overtime.findMany({
      where: { userId: session.user.id, year },
      include: {
        rows: { include: { employee: true } },
      },
      orderBy: { month: 'asc' },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  const currency = settings?.currency || 'ZMW'

  // ── Monthly totals (1–12) ────────────────────────────
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1

    const normalPay = paylaws
      .filter(p => p.month === m)
      .reduce((t, p) =>
        t + p.rows.reduce((s, r) => s + (r.netAmount || r.amount), 0), 0
      )

    const otPay = overtimes
      .filter(o => o.month === m)
      .reduce((t, o) =>
        t + o.rows.reduce((s, r) => s + r.amount, 0), 0
      )

    const food = paylaws
      .filter(p => p.month === m)
      .reduce((t, p) => t + p.foodExpense + p.otherDeduct, 0)

    return {
      month: m,
      name: MONTH_NAMES[i],
      shortName: MONTH_NAMES[i].slice(0, 3),
      normalPay,
      otPay,
      food,
      total: normalPay + otPay + food,
      hasPaylaws: paylaws.some(p => p.month === m),
    }
  })

  // ── Per worker YTD ───────────────────────────────────
  const workerMap: Record<string, {
    name: string
    jobTitle: string
    totalDays: number
    grossPay: number
    deductions: number
    netPay: number
    otHours: number
    otPay: number
    monthsActive: number[]
  }> = {}

  for (const p of paylaws) {
    for (const row of p.rows) {
      const id = row.employeeId
      if (!workerMap[id]) {
        workerMap[id] = {
          name: row.employee.name,
          jobTitle: row.employee.jobTitle,
          totalDays: 0,
          grossPay: 0,
          deductions: 0,
          netPay: 0,
          otHours: 0,
          otPay: 0,
          monthsActive: [],
        }
      }
      workerMap[id].totalDays  += row.daysWorked || 0
      workerMap[id].grossPay   += row.amount     || 0
      workerMap[id].deductions += row.deduction  || 0
      workerMap[id].netPay     += row.netAmount  || row.amount || 0
      if (!workerMap[id].monthsActive.includes(p.month)) {
        workerMap[id].monthsActive.push(p.month)
      }
    }
  }

  for (const o of overtimes) {
    for (const row of o.rows) {
      const id = row.employeeId
      if (!workerMap[id]) {
        workerMap[id] = {
          name: row.employee.name,
          jobTitle: row.employee.jobTitle,
          totalDays: 0,
          grossPay: 0,
          deductions: 0,
          netPay: 0,
          otHours: 0,
          otPay: 0,
          monthsActive: [],
        }
      }
      workerMap[id].otHours += row.totalHours || 0
      workerMap[id].otPay   += row.amount     || 0
    }
  }

  const workers = Object.entries(workerMap)
    .map(([id, data]) => ({
      id,
      ...data,
      total: data.netPay + data.otPay,
    }))
    .sort((a, b) => b.total - a.total)

  // ── Per site YTD ─────────────────────────────────────
  const siteMap: Record<string, {
    normalPay: number
    otPay: number
    food: number
    months: Set<number>
  }> = {}

  for (const p of paylaws) {
    if (!siteMap[p.site]) {
      siteMap[p.site] = { normalPay: 0, otPay: 0, food: 0, months: new Set() }
    }
    siteMap[p.site].food += p.foodExpense + p.otherDeduct
    siteMap[p.site].months.add(p.month)
    for (const r of p.rows) {
      siteMap[p.site].normalPay += r.netAmount || r.amount || 0
    }
  }

  for (const o of overtimes) {
    if (!siteMap[o.site]) {
      siteMap[o.site] = { normalPay: 0, otPay: 0, food: 0, months: new Set() }
    }
    for (const r of o.rows) {
      siteMap[o.site].otPay += r.amount || 0
    }
  }

  const sites = Object.entries(siteMap)
    .map(([name, data]) => ({
      name,
      normalPay: data.normalPay,
      otPay: data.otPay,
      food: data.food,
      total: data.normalPay + data.otPay + data.food,
      monthsActive: data.months.size,
    }))
    .sort((a, b) => b.total - a.total)

  // ── Grand YTD totals ─────────────────────────────────
  const ytdNormal = monthlyData.reduce((t, m) => t + m.normalPay, 0)
  const ytdOT     = monthlyData.reduce((t, m) => t + m.otPay, 0)
  const ytdFood   = monthlyData.reduce((t, m) => t + m.food, 0)
  const ytdTotal  = ytdNormal + ytdOT + ytdFood

  // Build year options — current year and 2 previous
  const yearOptions = [year, year - 1, year - 2]

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Year-to-date"
        subtitle={`Full year summary — ${year}`}
      />

      <div className="p-4 md:p-6 flex flex-col gap-5">

        {/* Tab row — switch between monthly and YTD */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <Link
              href="/summary"
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                         text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Monthly view
            </Link>
            <span
              className="px-4 py-2 text-sm bg-black text-white rounded-lg
                         font-medium"
            >
              Year-to-date
            </span>
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Year:</label>
            <div className="flex gap-1">
              {yearOptions.map(y => (
                <Link
                  key={y}
                  href={`/summary/ytd?year=${y}`}
                  className={`px-3 py-1.5 text-sm rounded-lg border
                              transition-colors font-medium
                    ${y === year
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {y}
                </Link>
              ))}
            </div>
          </div>
          <ExportExcelButton
            type="ytd"
            year={year}
            label="Export YTD Excel"
          />
        </div>

        {/* 4 YTD stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-green-600">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-2">
              Normal pay {year}
            </p>
            <p className="text-2xl font-semibold text-green-700">
              {formatMoney(ytdNormal, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {paylaws.length} paylaws
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-amber-500">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-2">
              Overtime {year}
            </p>
            <p className="text-2xl font-semibold text-amber-700">
              {formatMoney(ytdOT, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {overtimes.length} OT sheets
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-red-400">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-2">
              Food &amp; expenses {year}
            </p>
            <p className="text-2xl font-semibold text-red-600">
              {formatMoney(ytdFood, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Across all sites
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5
                          border-t-2 border-t-gray-300">
            <p className="text-xs font-medium text-gray-400 uppercase
                          tracking-wide mb-2">
              Total spent {year}
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatMoney(ytdTotal, settings?.currency || 'ZMW')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Everything combined
            </p>
          </div>
        </div>

        {/* Monthly chart — pass to client component */}
        <YTDClient monthlyData={monthlyData} year={year} currency={settings?.currency || 'ZMW'} />

        {/* Monthly breakdown table */}
        <div className="bg-white border border-gray-100 rounded-xl
                        overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              Month by month — {year}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3
                                 whitespace-nowrap">
                    Month
                  </th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3
                                 whitespace-nowrap">
                    Normal pay
                  </th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3
                                 whitespace-nowrap">
                    OT pay
                  </th>
                  <th className="text-left text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3
                                 whitespace-nowrap">
                    Expenses
                  </th>
                  <th className="text-right text-xs text-gray-400 font-medium
                                 uppercase tracking-wide px-5 py-3
                                 whitespace-nowrap">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map(m => (
                  <tr
                    key={m.month}
                    className={`border-b border-gray-50 transition-colors
                      ${m.total > 0
                        ? 'hover:bg-gray-50'
                        : 'opacity-40'}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0
                          ${m.total > 0 ? 'bg-green-500' : 'bg-gray-200'}`}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {m.name}
                        </span>
                        {/* Highlight current month */}
                        {m.month === now.getMonth() + 1 &&
                         year === now.getFullYear() && (
                          <span className="text-xs bg-blue-50 text-blue-600
                                           border border-blue-100 px-1.5 py-0.5
                                           rounded-full">
                            This month
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium
                                   text-green-700">
                      {m.normalPay > 0
                        ? formatMoney(m.normalPay, settings?.currency || 'ZMW')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium
                                   text-amber-700">
                      {m.otPay > 0
                        ? formatMoney(m.otPay, settings?.currency || 'ZMW')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {m.food > 0
                        ? formatMoney(m.food, settings?.currency || 'ZMW')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold
                                   text-gray-900">
                      {m.total > 0
                        ? formatMoney(m.total, settings?.currency || 'ZMW')
                        : '—'}
                    </td>
                  </tr>
                ))}

                {/* YTD total row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="px-5 py-3 text-sm font-bold text-gray-900">
                    YTD Total {year}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-green-700">
                    {formatMoney(ytdNormal, settings?.currency || 'ZMW')}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-amber-700">
                    {formatMoney(ytdOT, settings?.currency || 'ZMW')}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-600">
                    {formatMoney(ytdFood, settings?.currency || 'ZMW')}
                  </td>
                  <td className="px-5 py-3 text-right text-base font-bold
                                 text-gray-900">
                    {formatMoney(ytdTotal, settings?.currency || 'ZMW')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Per worker YTD table */}
        {workers.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl
                          overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                Per-worker year-to-date — {year}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Total earned across all months
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      Worker
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      Months active
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      Days worked
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      Normal pay
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      Deductions
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      OT pay
                    </th>
                    <th className="text-right text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-5 py-3
                                   whitespace-nowrap">
                      Total earned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w, i) => (
                    <tr
                      key={w.id}
                      className="border-b border-gray-50
                                 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {w.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {w.jobTitle}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {w.monthsActive.length} month
                        {w.monthsActive.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {w.totalDays} days
                      </td>
                      <td className="px-5 py-3 text-sm font-medium
                                     text-green-700">
                        {formatMoney(w.netPay, settings?.currency || 'ZMW')}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium
                                     text-red-600">
                        {w.deductions > 0
                          ? `− ${formatMoney(w.deductions, settings?.currency || 'ZMW')}`
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium
                                     text-amber-700">
                        {w.otPay > 0
                          ? formatMoney(w.otPay, settings?.currency || 'ZMW')
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-bold
                                     text-gray-900">
                        {formatMoney(w.total, settings?.currency || 'ZMW')}
                      </td>
                    </tr>
                  ))}

                  {/* Grand total */}
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td className="px-5 py-3 text-sm font-bold text-gray-900"
                        colSpan={3}>
                      Total — all workers {year}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-green-700">
                      {formatMoney(ytdNormal, settings?.currency || 'ZMW')}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-red-600">
                      {workers.reduce((t, w) => t + w.deductions, 0) > 0
                        ? `− ${formatMoney(workers.reduce((t, w) => t + w.deductions, 0), settings?.currency || 'ZMW')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-amber-700">
                      {formatMoney(ytdOT, settings?.currency || 'ZMW')}
                    </td>
                    <td className="px-5 py-3 text-right text-base font-bold
                                   text-gray-900">
                      {formatMoney((ytdNormal + ytdOT), settings?.currency || 'ZMW')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Per site YTD */}
        {sites.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sites.map(site => (
              <div
                key={site.name}
                className="bg-white border border-gray-100 rounded-xl p-5"
              >
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {site.name}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {site.monthsActive} month
                  {site.monthsActive !== 1 ? 's' : ''} active · {year}
                </p>
                <div className="flex flex-col gap-0">
                  <div className="flex justify-between items-center
                                  py-2.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Normal pay</span>
                    <span className="font-semibold text-green-700">
                      {formatMoney(site.normalPay, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center
                                  py-2.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Overtime pay</span>
                    <span className="font-semibold text-amber-700">
                      {formatMoney(site.otPay, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center
                                  py-2.5 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Food &amp; expenses</span>
                    <span className="font-medium text-gray-600">
                      {formatMoney(site.food, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center
                                  pt-3 text-sm">
                    <span className="font-semibold text-gray-900">
                      Total {year}
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {formatMoney(site.total, currency)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {workers.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl
                          px-6 py-16 text-center">
            <p className="text-sm text-gray-400 mb-2">
              No payroll data for {year} yet.
            </p>
            <Link
              href="/paylaws/new"
              className="text-sm underline text-gray-500 hover:text-gray-800"
            >
              Create your first paylaw
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}