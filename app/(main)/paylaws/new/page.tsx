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
  const ownerId   = isForeman ? session.user.adminId! : session.user.id

  const [employees, previousPaylaws, settings] = await Promise.all([
    prisma.employee.findMany({
      where: isForeman
        ? { userId: ownerId, site: session.user.site!, active: true }
        : { userId: ownerId, active: true },
      orderBy: { name: 'asc' },
    }),
    prisma.paylaw.findMany({
      where: isForeman
        ? { userId: ownerId, site: session.user.site! }
        : { userId: ownerId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, site: true, month: true, year: true },
      take: 10,
    }),
    prisma.settings.findUnique({
      where: { userId: ownerId },
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
        currency={settings?.currency || 'ZMW'}
        foremanSite={isForeman ? session.user.site || '' : ''}
        isForeman={isForeman}
        preparedByDefault={session.user.name || ''}
      />
    </div>
  )
}