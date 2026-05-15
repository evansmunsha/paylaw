import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import EmployeeClient from './EmployeeClient'

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const isForeman = session.user.role === 'foreman'

  const where = isForeman
    ? {
        userId: session.user.adminId!,
        site:   session.user.site!,
      }
    : { userId: session.user.id }

  const [employees, foremanUsers, settings] = await Promise.all([
    prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
    }),
    isForeman
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { adminId: session.user.id, role: 'foreman' },
          select: { site: true, name: true },
        }),
    prisma.settings.findUnique({
      where: { userId: isForeman ? session.user.adminId! : session.user.id },
    }),
  ])

  const existingSites = isForeman
    ? [session.user.site!]
    : [...new Set(employees.map(e => e.site).filter(Boolean))]

  const allSites = isForeman
    ? [session.user.site!]
    : [
        ...new Set([
          ...foremanUsers
            .map(f => f.site)
            .filter(Boolean) as string[],
          ...existingSites,
        ]),
      ]

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Employees"
        subtitle={
          isForeman
            ? `Workers at ${session.user.site}`
            : 'All workers across all sites'
        }
      />
      <EmployeeClient
        employees={employees}
        allSites={allSites}
        foremanSites={foremanUsers as { site: string; name: string | null }[]}
        currency={settings?.currency || 'ZMW'}
      />
    </div>
  )
}