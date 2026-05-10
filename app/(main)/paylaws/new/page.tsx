import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import NewPaylawClient from './NewPaylawClient'

export default async function NewPaylawPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const isForeman = session.user.role === 'foreman'

  // Foremen see only employees at their site
  // owned by their admin — same fix as employees page
  const employeeWhere = isForeman
    ? {
        userId: session.user.adminId!,
        site:   session.user.site!,
        active: true, // only show active workers
      }
    : {
        userId: session.user.id,
        active: true, // only show active workers
      }

  const [employees, previousPaylaws] = await Promise.all([
    prisma.employee.findMany({
      where: employeeWhere,
      orderBy: { name: 'asc' },
    }),
    prisma.paylaw.findMany({
      where: isForeman
        ? { userId: session.user.adminId!, site: session.user.site! }
        : { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, site: true, month: true, year: true },
      take: 10,
    }),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="New Paylaw"
        subtitle="Monthly attendance · mark every working day"
      />
      <NewPaylawClient
        employees={employees}
        previousPaylaws={previousPaylaws}
      />
    </div>
  )
}