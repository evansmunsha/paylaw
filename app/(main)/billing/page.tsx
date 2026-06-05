import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import { getLimits, getPlan, isFreeMode } from '@/lib/plans'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Foremen cannot access billing — redirect to dashboard
  if (session.user.role !== 'admin') redirect('/dashboard')

  if (isFreeMode()) redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan:               true,
      subStatus:          true,
      subCurrentPeriodEnd: true,
      stripeCustomerId:   true,
      stripeSubId:        true,
      _count: {
        select: {
          employees: true,
          paylaws:   true,
          foremen:   true,
        },
      },
    },
  })

  if (!user) redirect('/login')

  const plan   = getPlan(user.plan || 'free')
  const limits = getLimits(plan)

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Billing"
        subtitle="Manage your plan and subscription"
      />
      <BillingClient
        plan={plan}
        limits={limits}
        subStatus={user.subStatus || 'active'}
        periodEnd={user.subCurrentPeriodEnd?.toISOString() || null}
        hasStripe={!!user.stripeCustomerId}
        workerCount={user._count.employees}
        paylawCount={user._count.paylaws}
        foremanCount={user._count.foremen}
      />
    </div>
  )
}