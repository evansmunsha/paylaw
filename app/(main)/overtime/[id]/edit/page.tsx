import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import EditOvertimeClient from './EditOvertimeClient'

export default async function EditOvertimePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params
  const isForeman = session.user.role === 'foreman'
  const ownerId   = isForeman ? session.user.adminId! : session.user.id

  const [overtime, employees, settings] = await Promise.all([
    prisma.overtime.findFirst({
      where: { id, userId: ownerId },
      include: { rows: { include: { employee: true } } },
    }),
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
      where: { userId: ownerId },
    }),
  ])

  if (!overtime) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`Edit Overtime — ${overtime.site}`}
        subtitle="Continue entering hours"
      />
      <EditOvertimeClient 
        overtime={overtime} 
        employees={employees} 
        currency={settings?.currency || 'ZMW'}
      />
    </div>
  )
}