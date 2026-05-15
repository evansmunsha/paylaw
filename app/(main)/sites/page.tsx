import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrencySymbol } from '@/lib/currency'
import Topbar from '@/components/Topbar'
import Link from 'next/link'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export default async function SitesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  if (session.user.role !== 'admin') redirect('/dashboard')

  const now = new Date()

  const [paylaws, overtimes, foremen, settings] = await Promise.all([
    prisma.paylaw.findMany({
      where: { userId: session.user.id },
      include: { rows: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.overtime.findMany({
      where: { userId: session.user.id },
      include: { rows: true },
    }),
    prisma.user.findMany({
      where: { adminId: session.user.id, role: 'foreman' },
      select: { id: true, name: true, email: true, site: true },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  const currency = settings?.currency || 'ZMW'
  const symbol   = getCurrencySymbol(currency)

  // Build site map from all paylaws and overtime
  const siteMap: Record<string, {
    normalPay: number
    otPay: number
    food: number
    workers: Set<string>
    paylawCount: number
    otCount: number
    lastActivity: Date | null
  }> = {}

  for (const p of paylaws) {
    if (!siteMap[p.site]) {
      siteMap[p.site] = {
        normalPay: 0, otPay: 0, food: 0,
        workers: new Set(), paylawCount: 0,
        otCount: 0, lastActivity: null,
      }
    }
    siteMap[p.site].paylawCount++
    siteMap[p.site].food += p.foodExpense + p.otherDeduct
    if (
      !siteMap[p.site].lastActivity ||
      p.createdAt > siteMap[p.site].lastActivity!
    ) {
      siteMap[p.site].lastActivity = p.createdAt
    }
    for (const r of p.rows) {
      siteMap[p.site].normalPay += r.netAmount || r.amount || 0
      siteMap[p.site].workers.add(r.employeeId)
    }
  }

  for (const o of overtimes) {
    if (!siteMap[o.site]) {
      siteMap[o.site] = {
        normalPay: 0, otPay: 0, food: 0,
        workers: new Set(), paylawCount: 0,
        otCount: 0, lastActivity: null,
      }
    }
    siteMap[o.site].otCount++
    for (const r of o.rows) {
      siteMap[o.site].otPay += r.amount || 0
    }
  }

  const sites = Object.entries(siteMap)
    .map(([name, data]) => ({
      name,
      normalPay:    data.normalPay,
      otPay:        data.otPay,
      food:         data.food,
      total:        data.normalPay + data.otPay + data.food,
      workerCount:  data.workers.size,
      paylawCount:  data.paylawCount,
      otCount:      data.otCount,
      lastActivity: data.lastActivity,
      foreman:      foremen.find(f => f.site === name) || null,
    }))
    .sort((a, b) => b.total - a.total)

  const grandTotal  = sites.reduce((t, s) => t + s.total, 0)
  const totalWorkers = sites.reduce((t, s) => t + s.workerCount, 0)

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Sites"
        subtitle="All construction sites overview"
      />

      <div className="p-4 md:p-6 flex flex-col gap-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total sites
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {sites.length}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total workers
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {totalWorkers}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Foremen
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {foremen.length}
            </p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl
                          p-4 border-t-2 border-t-green-600">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total paid (all time)
            </p>
            <p className="text-2xl font-semibold text-green-700">
              {symbol} {grandTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Sites grid */}
        {sites.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl
                          py-16 text-center">
            <p className="text-sm text-gray-400 mb-2">No sites yet</p>
            <Link
              href="/paylaws/new"
              className="text-sm underline text-gray-500
                         hover:text-gray-800"
            >
              Create your first paylaw to see sites here
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3
                          gap-4">
            {sites.map(site => (
              <div
                key={site.name}
                className="bg-white border border-gray-100 rounded-xl p-5"
              >
                {/* Site header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {site.name}
                    </p>
                    {site.foreman ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-4 h-4 bg-blue-100 rounded-full
                                        flex items-center justify-center">
                          <span className="text-blue-700 text-xs font-bold">
                            {site.foreman.name?.[0]?.toUpperCase() || 'F'}
                          </span>
                        </div>
                        <span className="text-xs text-blue-600 font-medium">
                          {site.foreman.name}
                        </span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">
                          Foreman
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        No foreman assigned
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600
                                   px-2 py-1 rounded-full font-medium">
                    {site.workerCount} workers
                  </span>
                </div>

                {/* Financial breakdown */}
                <div className="flex flex-col gap-0">
                  <div className="flex justify-between items-center
                                  py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Normal pay</span>
                    <span className="font-medium text-green-700">
                      {symbol} {site.normalPay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center
                                  py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Overtime</span>
                    <span className="font-medium text-amber-700">
                      {symbol} {site.otPay.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center
                                  py-2 border-b border-gray-100 text-sm">
                    <span className="text-gray-500">Food &amp; expenses</span>
                    <span className="font-medium text-gray-600">
                      {symbol} {site.food.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center
                                  pt-3 text-sm">
                    <span className="font-semibold text-gray-900">
                      Total paid
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      {symbol} {site.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Stats footer */}
                <div className="flex items-center gap-3 mt-4 pt-4
                                border-t border-gray-100 flex-wrap">
                  <span className="text-xs text-gray-400">
                    {site.paylawCount} paylaw
                    {site.paylawCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">
                    {site.otCount} OT sheet
                    {site.otCount !== 1 ? 's' : ''}
                  </span>
                  {site.lastActivity && (
                    <>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">
                        Last:{' '}
                        {new Date(site.lastActivity).toLocaleDateString(
                          'en-GB', {
                            day: 'numeric',
                            month: 'short',
                          }
                        )}
                      </span>
                    </>
                  )}
                </div>

                {/* Quick links */}
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/paylaws?site=${encodeURIComponent(site.name)}`}
                    className="flex-1 text-center text-xs border
                               border-gray-200 py-1.5 rounded-lg
                               text-gray-600 hover:bg-gray-50
                               transition-colors"
                  >
                    View paylaws
                  </Link>
                  <Link
                    href={`/employees?site=${encodeURIComponent(site.name)}`}
                    className="flex-1 text-center text-xs border
                               border-gray-200 py-1.5 rounded-lg
                               text-gray-600 hover:bg-gray-50
                               transition-colors"
                  >
                    View workers
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}