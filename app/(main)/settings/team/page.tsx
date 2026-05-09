import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Only admins can access this page
  if (session.user.role !== 'admin') redirect('/dashboard')

  const foremen = await prisma.user.findMany({
    where: { adminId: session.user.id, role: 'foreman' },
    select: {
      id: true, name: true, email: true,
      site: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Team"
        subtitle="Manage foremen · each sees only their assigned site"
      />
      <TeamClient foremen={foremen} />
    </div>
  )
}