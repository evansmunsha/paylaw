import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatMoney } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import UpgradeBanner from '@/components/UpgradeBanner'
import { getLimits } from '@/lib/plans'
import Link from 'next/link'
import DeletePaylaw from './DeletePaylaw'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default async function PaylawsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userWhere = session.user.role === 'foreman'
    ? { userId: session.user.adminId!, site: session.user.site! }
    : { userId: session.user.id }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.role === 'foreman'
        ? session.user.adminId!
        : session.user.id,
    },
    select: { plan: true },
  })

  const plan = user?.plan || 'free'
  const limits = getLimits(plan)

  const [paylaws, settings] = await Promise.all([
    prisma.paylaw.findMany({
      where: userWhere,
      include: { rows: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  const currency = settings?.currency || 'ZMW'
  const currentMonthCount = paylaws.filter(
    p => p.month === new Date().getMonth() + 1 &&
         p.year === new Date().getFullYear()
  ).length

  const showPaylawLimitBanner =
    limits.maxPaylaws !== -1 &&
    currentMonthCount >= limits.maxPaylaws

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Paylaws"
        subtitle="Normal attendance sheets · paid per day"
      />

      <div className="p-4 md:p-6 flex flex-col gap-5">
        {showPaylawLimitBanner && (
          <UpgradeBanner
            title="You've reached this month's paylaw limit"
            message="The free plan allows up to 3 paylaws per month. Upgrade to Starter for unlimited paylaws and automated reporting."
            feature="3 monthly paylaws on Free · Unlimited on Starter"
            compact
          />
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {paylaws.length} paylaw{paylaws.length !== 1 ? 's' : ''} total
          </p>
          <Link
            href="/paylaws/new"
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
            New Paylaw
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {paylaws.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-gray-400 mb-2">No paylaws yet</p>
              <Link
                href="/paylaws/new"
                className="text-sm underline text-gray-500 hover:text-gray-800"
              >
                Create your first paylaw
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
                      Total Pay
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
                  {paylaws.map(p => {
                    const total = p.rows.reduce((t, r) => t + r.amount, 0)
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 hover:bg-gray-50
                                   transition-colors"
                      >
                        <td className="px-4 md:px-5 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {p.site}
                          </div>
                          {/* Show period under site on mobile */}
                          <div className="text-xs text-gray-400 mt-0.5 sm:hidden">
                            {MONTH_NAMES[p.month - 1]} {p.year}
                          </div>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-sm text-gray-600
                                       hidden sm:table-cell whitespace-nowrap">
                          {MONTH_NAMES[p.month - 1]} {p.year}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-sm text-gray-600
                                       hidden md:table-cell">
                          {p.rows.length}
                        </td>
                        <td className="px-4 md:px-5 py-3 text-sm font-semibold
                                       text-green-700 whitespace-nowrap">
                          {formatMoney(total, currency)}
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5
                                            rounded-full whitespace-nowrap
                            ${p.status === 'done'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'}`}>
                            {p.status === 'done' ? 'Done' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 md:px-5 py-3">
                          <div className="flex gap-2 justify-end">
                            <Link
                              href={`/paylaws/${p.id}`}
                              className="text-xs border border-gray-200 px-3
                                         py-1 rounded-lg text-gray-600
                                         hover:bg-gray-50 transition-colors
                                         whitespace-nowrap"
                            >
                              View
                            </Link>
                            <Link
                              href={`/paylaws/${p.id}/edit`}
                              className="text-xs border border-gray-200 px-3
                                         py-1 rounded-lg text-gray-600
                                         hover:bg-gray-50 transition-colors
                                         hidden sm:block"
                            >
                              Edit
                            </Link>
                            {/* Delete button — always visible */}
                            <DeletePaylaw id={p.id} site={p.site} />
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