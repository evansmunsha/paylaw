import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import NewPaylawClient from './NewPaylawClient'

export default async function NewPaylawPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [employees, previousPaylaws] = await Promise.all([
    prisma.employee.findMany({
      where: { userId: session.user.id, active: true },
      orderBy: { name: 'asc' },
    }),
    // Fetch previous paylaws so user can copy workers from them
    prisma.paylaw.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      // Only need basic info for the dropdown
      select: {
        id: true,
        site: true,
        month: true,
        year: true,
      },
      // Limit to last 10 so the dropdown is not too long
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