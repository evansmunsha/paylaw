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

  // Load the existing paylaw with all its rows
  const paylaw = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
    include: {
      rows: {
        include: { employee: true },
      },
    },
  })

  if (!paylaw) notFound()

  // Load all active employees for this user
  // so they can add more workers if needed
  const employees = await prisma.employee.findMany({
    where: { userId: session.user.id, active: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title={`Edit Paylaw — ${paylaw.site}`}
        subtitle="Continue marking attendance · changes are saved when you click save"
      />
      <EditPaylawClient
        paylaw={paylaw}
        employees={employees}
      />
    </div>
  )
}