import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import Link from 'next/link'
import DeleteOvertime from './DeleteOvertime'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default async function OvertimePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const overtimes = await prisma.overtime.findMany({
    where: { userId: session.user.id },
    include: { rows: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Overtime Sheets"
        subtitle="Extra hours · paid per hour"
      />

      <div className="p-4 md:p-6 flex flex-col gap-5">

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {overtimes.length} sheet{overtimes.length !== 1 ? 's' : ''} total
          </p>
          <Link
            href="/overtime/new"
            className="flex items-center gap-2 bg-black text-white text-sm
                       font-medium px-4 py-2 rounded-lg hover:bg-gray-800
                       transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            New OT Sheet
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {overtimes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-gray-400 mb-2">
                No overtime sheets yet
              </p>
              <Link
                href="/overtime/new"
                className="text-sm underline text-gray-500 hover:text-gray-800"
              >
                Create your first OT sheet
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-4 md:px-5 py-3
                                   whitespace-nowrap">
                      Site
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-4 md:px-5 py-3
                                   whitespace-nowrap hidden sm:table-cell">
                      Period
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-4 md:px-5 py-3
                                   whitespace-nowrap hidden md:table-cell">
                      Workers
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-4 md:px-5 py-3
                                   whitespace-nowrap">
                      OT Pay
                    </th>
                    <th className="text-left text-xs text-gray-400 font-medium
                                   uppercase tracking-wide px-4 md:px-5 py-3
                                   whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 md:px-5 py-3"/>
                  </tr>
                </thead>
                <tbody>
                  {overtimes.map(o => {
                    const totalPay = o.rows.reduce((t, r) => t + r.amount, 0)
                    const totalHrs = o.rows.reduce((t, r) => t + r.totalHours, 0)
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-gray-50 hover:bg-gray-50
                                   transition-colors"
                      >
                        <td className="px-4 md:px-5 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {o.site}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5 sm:hidden">
                            {MONTH_NAMES[o.month - 1]} {o.year}
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-sm text-gray-600
                                       hidden sm:table-cell whitespace-nowrap">
                          {MONTH_NAMES[o.month - 1]} {o.year}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-sm text-gray-600
                                       hidden md:table-cell">
                          {o.rows.length}
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="text-sm font-semibold text-amber-700
                                          whitespace-nowrap">
                            K {totalPay.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {totalHrs} hrs
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5
                                            rounded-full whitespace-nowrap
                            ${o.status === 'done'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'}`}>
                            {o.status === 'done' ? 'Done' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex gap-2 justify-end">
                            <Link
                              href={`/overtime/${o.id}`}
                              className="text-xs border border-gray-200 px-3
                                         py-1 rounded-lg text-gray-600
                                         hover:bg-gray-50 transition-colors
                                         whitespace-nowrap"
                            >
                              View
                            </Link>
                            <Link
                              href={`/overtime/${o.id}/edit`}
                              className="text-xs border border-gray-200 px-3
                                         py-1 rounded-lg text-gray-600
                                         hover:bg-gray-50 transition-colors
                                         hidden sm:block"
                            >
                              Edit
                            </Link>
                            <DeleteOvertime id={o.id} site={o.site} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}