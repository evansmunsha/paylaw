import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import EmployeeClient from './EmployeeClient'

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Fetch all employees from database
  const employees = await prisma.employee.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Employees"
        subtitle="Manage your workforce · rates auto-fill when added to paylaws"
      />
      {/* 
        We pass employees to a client component
        because the add/edit/delete actions need
        useState and form interactions 
      */}
      <EmployeeClient employees={employees} />
    </div>
  )
}