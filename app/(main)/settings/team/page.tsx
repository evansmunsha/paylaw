import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import UpgradeBanner from '@/components/UpgradeBanner'
import { getLimits, getPlan } from '@/lib/plans'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Only admins can access this page
  if (session.user.role !== 'admin') redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })

  const plan   = getPlan(user?.plan || 'free')
  const limits = getLimits(plan)

  const foremen = await prisma.user.findMany({
    where: { adminId: session.user.id, role: 'foreman' },
    select: {
      id: true, name: true, email: true,
      site: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const atForemanLimit =
    limits.foremen !== -1 &&
    limits.foremen === 0

  const reachedForemanLimit =
    limits.foremen !== -1 &&
    foremen.length >= limits.foremen

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Team"
        subtitle="Manage foremen · each sees only their assigned site"
      />
      <div className="p-4 md:p-6 flex flex-col gap-5">
        {atForemanLimit && (
          <UpgradeBanner
            title="Foreman accounts are not available on the free plan"
            message="Upgrade to Starter to invite a foreman who can mark attendance for their site. You review and approve before any PDF is generated."
            feature="1 foreman on Starter · Unlimited foremen on Pro"
            compact
          />
        )}
        {!atForemanLimit && reachedForemanLimit && (
          <UpgradeBanner
            title="You have reached your foreman limit"
            message="Starter plan allows 1 foreman account. Upgrade to Pro for unlimited foremen across all your sites."
            compact
          />
        )}
      </div>
      <TeamClient foremen={foremen} />
    </div>
  )
}