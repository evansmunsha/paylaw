import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMoney, getCurrencySymbol } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import ApproveReject from '@/components/ApproveReject'
import Link from 'next/link'
import DownloadOvertimePDF from './DownloadOvertimePDF'


const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default async function ViewOvertimePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params

  const [overtime, settings] = await Promise.all([
    prisma.overtime.findFirst({
      where: { id, userId: session.user.id },
      include: {
        rows: {
          include: { employee: true },
        },
      },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  if (!overtime) notFound()

  const currency = settings?.currency || 'ZMW'
  const currencySymbol = getCurrencySymbol(currency)

  const monthName   = MONTH_NAMES[overtime.month - 1]
  const daysInMonth = new Date(overtime.year, overtime.month, 0).getDate()
  const allDays     = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getDayOfWeek(day: number) {
    return new Date(overtime!.year, overtime!.month - 1, day).getDay()
  }

  function isWeekend(day: number) {
    const dow = getDayOfWeek(day)
    return dow === 0 || dow === 6
  }

  const grandHours  = overtime.rows.reduce((t, r) => t + r.totalHours, 0)
  const grandAmount = overtime.rows.reduce((t, r) => t + r.amount, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`Overtime — ${overtime.site}`}
        subtitle={`${monthName} ${overtime.year}`}
      />

      <div className="p-6 flex flex-col gap-5">

        {/* Action buttons */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/overtime"
            className="flex items-center gap-2 text-sm text-gray-500
                       hover:text-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to overtime
          </Link>

          <div className="flex gap-3 items-center">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full
              ${overtime.status === 'done'
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
              {overtime.status === 'done' ? '✓ Done' : '● Draft'}
            </span>

            {overtime.status === 'draft' && (
              <Link
                href={`/overtime/${overtime.id}/edit`}
                className="flex items-center gap-2 bg-amber-50 border
                           border-amber-200 text-amber-800 text-sm font-medium
                           px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M9 1.5L11.5 4L5 10.5H2.5V8L9 1.5Z"
                        stroke="currentColor" strokeWidth="1.3"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue marking
              </Link>
            )}

            <ApproveReject id={overtime.id} status={overtime.status} isAdmin={session.user.role === 'admin'} />

            <Link
              href={`/overtime/${overtime.id}/edit`}
              className="flex items-center gap-2 border border-gray-200
                         text-gray-700 text-sm font-medium px-4 py-2
                         rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>

            <DownloadOvertimePDF
                site={overtime.site}
                month={overtime.month}
                year={overtime.year}
                preparedBy={overtime.preparedBy}
                currency={currency}
                rows={overtime.rows.map(r => ({
                    employeeId: r.employeeId,
                    name: r.employee.name,
                    jobTitle: r.employee.jobTitle,
                    otRate: r.otRate,
                    totalHours: r.totalHours,
                    amount: r.amount,
                    hours: r.hours as Record<string, number>,
                    signature: r.signature || '',
                }))}
            />

            <Link
                href={`/overtime/${overtime.id}/print`}
                target="_blank"
                className="flex items-center gap-2 border border-gray-200 text-gray-700
                          text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50
                          transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="2" y="4" width="9" height="6" rx="1.5"
                        stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4 4V3a.5.5 0 01.5-.5h4a.5.5 0 01.5.5v1"
                        stroke="currentColor" strokeWidth="1.3"/>
                  <rect x="3.5" y="7" width="6" height="3" rx=".5"
                        fill="currentColor"/>
                </svg>
                Print
              </Link>
          </div>
        </div>

        {/* Sheet info */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        mb-4 flex items-center gap-3 after:flex-1 after:h-px
                        after:bg-gray-100 after:content-['']">
            Sheet info
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Site</p>
              <p className="text-sm font-medium text-gray-900">{overtime.site}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Period</p>
              <p className="text-sm font-medium text-gray-900">
                {monthName} {overtime.year}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Workers</p>
              <p className="text-sm font-medium text-gray-900">{overtime.rows.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Prepared by
              </p>
              <p className="text-sm font-medium text-gray-900">{overtime.preparedBy}</p>
            </div>
          </div>
        </div>

        {/* OT Hours grid — read only */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        mb-4 flex items-center gap-3 after:flex-1 after:h-px
                        after:bg-gray-100 after:content-['']">
            Overtime hours — {monthName} {overtime.year}
          </p>

          <div
            className="border border-gray-200 rounded-xl overflow-x-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#FCD34D #FEF3C7',
            }}
          >
            <table style={{
              minWidth: 'max-content',
              borderCollapse: 'separate',
              borderSpacing: 0,
            }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r
                                 border-gray-200 text-left text-xs font-medium
                                 text-gray-400 uppercase tracking-wide px-4 py-3
                                 min-w-36">
                    Name
                  </th>
                  <th className="sticky left-36 z-20 bg-gray-50 border-b border-r
                                 border-gray-200 text-left text-xs font-medium
                                 text-gray-400 uppercase tracking-wide px-3 py-3
                                 min-w-28">
                    Job title
                  </th>
                  <th className="sticky left-64 z-20 bg-gray-50 border-b border-r
                                 border-gray-200 text-center text-xs font-medium
                                 text-gray-400 uppercase tracking-wide px-3 py-3
                                 min-w-20">
                    {currencySymbol} / hr
                  </th>

                  {allDays.map(day => {
                    const dow     = getDayOfWeek(day)
                    const weekend = isWeekend(day)
                    return (
                      <th key={day}
                          className={`border-b border-gray-200 text-center
                                      px-0 py-2 min-w-10
                                      ${weekend ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-semibold
                            ${weekend ? 'text-amber-600' : 'text-gray-600'}`}>
                            {day}
                          </span>
                          <span className={`text-xs
                            ${weekend ? 'text-amber-400' : 'text-gray-300'}`}>
                            {DAY_LABELS[dow]}
                          </span>
                        </div>
                      </th>
                    )
                  })}

                  <th className="border-b border-l border-gray-200 bg-gray-50
                                 text-center text-xs font-medium text-gray-400
                                 uppercase tracking-wide px-3 py-3 min-w-16">
                    Total hrs
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50 text-right
                                 text-xs font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-24">
                    Amount
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50 text-left
                                 text-xs font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-24">
                    Signature
                  </th>
                </tr>
              </thead>

              <tbody>
                {overtime.rows.map(row => {
                  const hours = row.hours as Record<string, number>
                  return (
                    <tr key={row.id}
                        className="border-b border-gray-100 hover:bg-gray-50/50">

                      <td className="sticky left-0 z-10 bg-white border-r
                                     border-gray-100 px-4 py-2.5 text-sm
                                     font-medium text-gray-900 min-w-36">
                        {row.employee.name}
                      </td>

                      <td className="sticky left-36 z-10 bg-white border-r
                                     border-gray-100 px-3 py-2.5 text-xs
                                     text-gray-500 min-w-28">
                        {row.employee.jobTitle}
                      </td>

                      <td className="sticky left-64 z-10 bg-white border-r
                                     border-gray-200 px-3 py-2.5 text-center
                                     min-w-20">
                        <span className="text-xs font-semibold text-amber-700
                                         bg-amber-50 border border-amber-200
                                         rounded px-2 py-0.5">
                          {currencySymbol} {row.otRate}
                        </span>
                      </td>

                      {allDays.map(day => {
                        const val     = hours[String(day)] || 0
                        const weekend = isWeekend(day)
                        return (
                          <td key={day}
                              className={`px-0.5 py-2 text-center
                                ${weekend ? 'bg-amber-50/40' : ''}`}>
                            <span className={`w-9 h-7 rounded text-xs font-bold
                                             flex items-center justify-center
                                             mx-auto border
                              ${val > 0
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : weekend
                                ? 'bg-amber-50/40 border-amber-100 text-amber-200'
                                : 'bg-gray-50 border-gray-200 text-gray-300'
                              }`}>
                              {val > 0 ? val : ''}
                            </span>
                          </td>
                        )
                      })}

                      <td className="border-l border-gray-100 px-3 py-2.5
                                     text-center text-sm font-semibold
                                     text-amber-700">
                        {row.totalHours > 0 ? `${row.totalHours}h` : '—'}
                      </td>

                      <td className="px-3 py-2.5 text-right text-sm font-semibold
                                     text-amber-700 whitespace-nowrap">
                        {formatMoney(row.amount, currency)}
                      </td>

                      <td className="px-3 py-2.5 text-xs text-gray-500 italic">
                        {row.signature || '—'}
                      </td>
                    </tr>
                  )
                })}

                {/* Daily total row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3}
                      className="sticky left-0 z-10 bg-gray-50 px-4 py-2
                                 text-xs font-semibold text-gray-500">
                    Daily hrs total
                  </td>
                  {allDays.map(day => {
                    const total = overtime.rows.reduce((t, r) => {
                      const h = r.hours as Record<string, number>
                      return t + (h[String(day)] || 0)
                    }, 0)
                    return (
                      <td key={day} className="text-center px-0.5 py-2">
                        <span className={`text-xs font-semibold
                          ${total > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
                          {total > 0 ? `${total}h` : '—'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="border-l border-gray-200 px-3 py-2 text-center
                                 text-xs font-bold text-amber-700">
                    {grandHours}h
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold
                                 text-amber-700 whitespace-nowrap">
                    {formatMoney(grandAmount, currency)}
                  </td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        mb-4 flex items-center gap-3 after:flex-1 after:h-px
                        after:bg-gray-100 after:content-['']">
            Summary
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Total OT hours
              </p>
              <p className="text-sm font-semibold text-amber-700">
                {grandHours} hrs
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Total OT payout
              </p>
              <p className="text-base font-bold text-amber-700">
                {formatMoney(grandAmount, currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Prepared by footer */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Prepared by
              </p>
              <p className="text-sm font-medium text-gray-900">
                {overtime.preparedBy}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Signature
              </p>
              <div className="border-b border-gray-300 h-8"/>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Date
              </p>
              <p className="text-sm text-gray-600">
                {overtime.year} / {String(overtime.month).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}