import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import NewOvertimeClient from './NewOvertimeClient'

export default async function NewOvertimePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const isForeman = session.user.role === 'foreman'
  const userId = isForeman ? session.user.adminId! : session.user.id

  const [employees, settings] = await Promise.all([
    prisma.employee.findMany({
      where: isForeman
        ? {
            userId: session.user.adminId!,
            site:   session.user.site!,
            active: true,
          }
        : {
            userId: session.user.id,
            active: true,
          },
      orderBy: { name: 'asc' },
    }),
    prisma.settings.findUnique({
      where: { userId },
    }),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="New Overtime Sheet"
        subtitle="Extra hours · each worker paid per hour"
      />
      <NewOvertimeClient 
        employees={employees} 
        currency={settings?.currency || 'ZMW'}
      />
    </div>
  )
}