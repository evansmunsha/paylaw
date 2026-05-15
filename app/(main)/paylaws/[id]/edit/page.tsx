import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import EditPaylawClient from './EditPaylawClient'

export default async function EditPaylawPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params
  const isForeman = session.user.role === 'foreman'

  const ownerId = isForeman
    ? session.user.adminId!
    : session.user.id

  const [paylaw, employees, settings] = await Promise.all([
    prisma.paylaw.findFirst({
      where: { id, userId: ownerId },
      include: {
        rows: { include: { employee: true } },
      },
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

  if (!paylaw) notFound()

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`Edit Paylaw — ${paylaw.site}`}
        subtitle="Continue marking attendance"
      />
      <EditPaylawClient 
        paylaw={paylaw} 
        employees={employees} 
        currency={settings?.currency || 'ZMW'}
      />
    </div>
  )
}