import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMoney, getCurrencySymbol } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import ApproveReject from '@/components/ApproveReject'
import Link from 'next/link'
import DownloadPaylawPDF from './DownloadPaylawPDF'
import PayslipButton from './PayslipButton'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default async function ViewPaylawPage({
  params,
}: {
  // Next.js 16 — params is a Promise
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Await params before using id
  const { id } = await params

  // Fetch the paylaw with all its rows and employee info
  const [paylaw, settings] = await Promise.all([
    prisma.paylaw.findFirst({
      where: {
        id,
        userId: session.user.id, // security — only show if it belongs to this user
      },
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

  // If not found or does not belong to this user — show 404
  if (!paylaw) notFound()

  const currency = settings?.currency || 'ZMW'
  const currencySymbol = getCurrencySymbol(currency)

  const monthName = MONTH_NAMES[paylaw.month - 1]
  const daysInMonth = new Date(paylaw.year, paylaw.month, 0).getDate()
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getDayOfWeek(day: number) {
    return new Date(paylaw!.year, paylaw!.month - 1, day).getDay()
  }

  function isWeekend(day: number) {
    const dow = getDayOfWeek(day)
    return dow === 0 || dow === 6
  }

  // Grand totals
  const totalNormal = paylaw.rows.reduce((t, r) => t + r.amount, 0)
  const totalSpent  = totalNormal + paylaw.foodExpense + paylaw.otherDeduct

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={'Paylaw — ' + paylaw.site}
        subtitle={monthName + ' ' + paylaw.year}
      />

      <div className="p-4 sm:p-6 flex flex-col gap-4">

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link
            href="/paylaws"
            className="flex items-center gap-2 text-sm text-gray-500
              hover:text-gray-800 transition-colors"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.4"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to paylaws
        </Link>

        <div className="flex gap-2 sm:gap-3 items-center flex-wrap overflow-x-auto">
          <span className={paylaw.status === 'done'
                ? 'text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100'
                : 'text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100'}>
            {paylaw.status === 'done' ? '✓ Done' : '● Draft'}
            </span>

            {/* Continue marking button — shows for drafts */}
            {paylaw.status === 'draft' && (
            <Link
              href={`/paylaws/${paylaw.id}/edit`}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200
                  text-amber-800 text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg
                  hover:bg-amber-100 transition-colors shrink-0"
            >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M9 1.5L11.5 4L5 10.5H2.5V8L9 1.5Z" stroke="currentColor"
                        strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Continue marking
            </Link>
            )}

            {/* Admin approve/reject controls (shows when submitted) */}
            {/* Rendered via a client component to call approve API */}
            <ApproveReject id={paylaw.id} status={paylaw.status} isAdmin={session.user.role === 'admin'} />

            {/* Edit even if done */}
            <Link
            href={`/paylaws/${paylaw.id}/edit`}
            className="flex items-center gap-2 border border-gray-200 text-gray-700
                        text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-50
                        transition-colors shrink-0"
            >
            Edit
            </Link>

            

        <div className="shrink-0">
        <DownloadPaylawPDF
            site={paylaw.site}
            month={paylaw.month}
            year={paylaw.year}
            preparedBy={paylaw.preparedBy}
            foodExpense={paylaw.foodExpense}
            otherDeduct={paylaw.otherDeduct}
            rows={paylaw.rows.map(r => ({
                employeeId: r.employeeId,
                name: r.employee.name,
                jobTitle: r.employee.jobTitle,
                dayRate: r.dayRate,
                daysWorked: r.daysWorked,
                amount: r.amount,
                attendance: r.attendance as Record<string, boolean>,
                signature: r.signature || '',
            }))}
            currency={settings?.currency || 'ZMW'}
            />
          <Link
            href={`/paylaws/${paylaw.id}/print`}
            target="_blank"
            className="flex items-center gap-2 border border-gray-200 text-gray-700
                      text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-50
                      transition-colors shrink-0"
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
        </div>

        {/* Sheet header info */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        mb-4 flex items-center gap-3 after:flex-1 after:h-px
                        after:bg-gray-100 after:content-['']">
            Sheet info
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Site</p>
              <p className="text-sm font-medium text-gray-900">{paylaw.site}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Period</p>
              <p className="text-sm font-medium text-gray-900">
                {monthName} {paylaw.year}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Workers</p>
              <p className="text-sm font-medium text-gray-900">{paylaw.rows.length}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Prepared by
              </p>
              <p className="text-sm font-medium text-gray-900">{paylaw.preparedBy}</p>
            </div>
          </div>
        </div>

        {/* Attendance grid — read only view */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        mb-4 flex items-center gap-3 after:flex-1 after:h-px
                        after:bg-gray-100 after:content-['']">
            Monthly attendance — {monthName} {paylaw.year}
          </p>

          <div
            className="border border-gray-200 rounded-xl overflow-x-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#86EFAC #F3F4F6',
            }}
          >
            <table style={{ minWidth: 'max-content', borderCollapse: 'separate', borderSpacing: 0 }}>
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
                    {currencySymbol} / day
                  </th>

                  {allDays.map(day => {
                    const dow = getDayOfWeek(day)
                    const weekend = isWeekend(day)
                    return (
                      <th
                        key={day}
                        className={`border-b border-gray-200 text-center
                                    px-0 py-2 min-w-9
                                    ${weekend ? 'bg-amber-50' : 'bg-gray-50'}`}
                      >
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
                                 uppercase tracking-wide px-3 py-3 min-w-14">
                    Days
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
                  <th className="border-b border-gray-200 bg-gray-50 text-left
                                 text-xs font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-24">
                    Pay slip
                  </th>
                </tr>
              </thead>

              <tbody>
                {paylaw.rows.map(row => {
                  // attendance is stored as JSON in the database
                  // cast it back to the shape we need
                  const attendance = row.attendance as Record<string, boolean>

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
                        <span className="text-xs font-semibold text-green-700
                                         bg-green-50 border border-green-200
                                         rounded px-2 py-0.5">
                          {currencySymbol} {row.dayRate}
                        </span>
                      </td>

                      {allDays.map(day => {
                        const present = !!attendance[String(day)]
                        const weekend = isWeekend(day)
                        return (
                          <td
                            key={day}
                            className={`px-0.5 py-2 text-center
                              ${weekend ? 'bg-amber-50/40' : ''}`}
                          >
                            <span
                              className={`w-7 h-7 rounded text-xs font-bold
                                          flex items-center justify-center mx-auto
                                ${present
                                  ? 'bg-green-100 border border-green-300 text-green-700'
                                  : weekend
                                  ? 'bg-amber-50 border border-amber-100 text-amber-200'
                                  : 'bg-gray-100 border border-gray-200 text-gray-200'
                                }`}
                            >
                              {present ? '✓' : ''}
                            </span>
                          </td>
                        )
                      })}

                      <td className="border-l border-gray-100 px-3 py-2.5
                                     text-center text-sm font-semibold text-gray-800">
                        {row.daysWorked}
                      </td>

                      <td className="px-3 py-2.5 text-right text-sm font-semibold
                                     text-green-700 whitespace-nowrap">
                        {formatMoney(row.amount, currency)}
                      </td>

                      <td className="px-3 py-2.5 text-xs text-gray-500 italic">
                        {row.signature || '—'}
                      </td>
                      
                      <td className="px-3 py-2.5 text-xs text-gray-500 italic">
                        <PayslipButton
                          paylawId={paylaw.id}
                          employeeId={row.employee.id}
                          workerName={row.employee.name}
                        />
                      </td>
                    </tr>
                  )
                })}

                {/* Daily total row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3}
                      className="sticky left-0 z-10 bg-gray-50 px-4 py-2
                                 text-xs font-semibold text-gray-500">
                    Daily total
                  </td>
                  {allDays.map(day => {
                    const count = paylaw.rows.filter(r => {
                      const att = r.attendance as Record<string, boolean>
                      return !!att[String(day)]
                    }).length
                    return (
                      <td key={day} className="text-center px-0.5 py-2">
                        <span className={`text-xs font-semibold
                          ${count > 0 ? 'text-green-700' : 'text-gray-300'}`}>
                          {count > 0 ? count : '—'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="border-l border-gray-200 px-3 py-2 text-center
                                 text-xs font-bold text-gray-700">
                    {paylaw.rows.reduce((t, r) => t + r.daysWorked, 0)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold
                                 text-green-700 whitespace-nowrap">
                    {formatMoney(totalNormal, currency)}
                  </td>
                  <td/>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Description & totals */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        mb-4 flex items-center gap-3 after:flex-1 after:h-px
                        after:bg-gray-100 after:content-['']">
            Description &amp; expenses
          </p>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Salaries total
              </p>
              <p className="text-sm font-semibold text-green-700">
                {formatMoney(totalNormal, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Food expense
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatMoney(paylaw.foodExpense, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Other deductions
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatMoney(paylaw.otherDeduct, currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                Total amount spent
              </p>
              <p className="text-base font-bold text-gray-900">
                {formatMoney(totalSpent, currency)}
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
              <p className="text-sm font-medium text-gray-900">{paylaw.preparedBy}</p>
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
                {paylaw.year} / {String(paylaw.month).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const paylaw = await prisma.paylaw.findUnique({ where: { id }, include: { rows: true } })
  if (!paylaw) return {}

  const title = `Paylaw — ${paylaw.site} (${MONTH_NAMES[paylaw.month - 1]} ${paylaw.year})`
  const description = `Paylaw for ${paylaw.site} prepared by ${paylaw.preparedBy}. ${paylaw.rows.length} workers, total ${formatMoney(paylaw.rows.reduce((t, r) => t + r.amount, 0), 'ZMW')}.`
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app'
  const url = `${base.replace(/\/$/, '')}/paylaws/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: `${base.replace(/\/$/, '')}/api/og/paylaw/${id}`,
          alt: 'PayLaw preview image',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}