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

  // Foremen see only employees at their site
  // owned by their admin
  // Admins see all their own employees
  const where = isForeman
    ? {
        userId: session.user.adminId!, // employees belong to admin
        site:   session.user.site!,    // filter to foreman's site only
      }
    : { userId: session.user.id }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  // For admin — fetch all foreman sites so they can
  // assign workers to them from a dropdown
  const foremanSites = isForeman
    ? []
    : await prisma.user.findMany({
        where: { adminId: session.user.id, role: 'foreman' },
        select: { site: true, name: true },
      })

  // Get unique sites from existing employees
  const existingSites = isForeman
    ? [session.user.site!]
    : [...new Set(employees.map(e => e.site).filter(Boolean))]

  // Combine foreman sites and existing employee sites
  // so admin can pick any site when adding/editing
  const allSites = isForeman
    ? [session.user.site!]
    : [
        ...new Set([
          ...foremanSites.map(f => f.site).filter(Boolean) as string[],
          ...existingSites,
        ])
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
        foremanSites={foremanSites as { site: string; name: string | null }[]}
      />
    </div>
  )
}