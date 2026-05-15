import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import AuditClient from './AuditClient'

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { page: qPage, type: qType } = await searchParams
  const page  = parseInt(qPage  || '1')
  const limit = 50
  const type  = qType || 'all'

  const where = session.user.role === 'foreman'
    ? { userId: session.user.id }
    : { adminId: session.user.id }

  const typeFilter = type !== 'all' ? { entityType: type } : {}

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { ...where, ...typeFilter },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({
      where: { ...where, ...typeFilter },
    }),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Audit Log"
        subtitle="Full history of every action in your account"
      />
      <AuditClient
        logs={logs}
        total={total}
        page={page}
        limit={limit}
        currentType={type}
      />
    </div>
  )
}