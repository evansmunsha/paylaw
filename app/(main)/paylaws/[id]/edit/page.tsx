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

  const paylaw = await prisma.paylaw.findFirst({
    where: { id, userId: ownerId },
    include: {
      rows: { include: { employee: true } },
    },
  })

  if (!paylaw) notFound()

  // Same fix — foremen see their site's active employees
  const employeeWhere = isForeman
    ? {
        userId: session.user.adminId!,
        site:   session.user.site!,
        active: true,
      }
    : {
        userId: session.user.id,
        active: true,
      }

  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    orderBy: { name: 'asc' },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`Edit Paylaw — ${paylaw.site}`}
        subtitle="Continue marking attendance"
      />
      <EditPaylawClient paylaw={paylaw} employees={employees} />
    </div>
  )
}