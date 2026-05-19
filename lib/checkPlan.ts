import { prisma } from './prisma'
import { getLimits } from './plans'

interface PlanCheckResult {
  allowed: boolean
  reason?: string
  upgrade?: string
}

// Check if a user can do an action based on their plan
export async function checkPlan(
  userId: string,
  action: 'create_paylaw' | 'create_overtime' | 'add_worker' |
          'create_foreman' | 'view_reports' | 'export_excel'
): Promise<PlanCheckResult> {

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          paylaws:  true,
          overtimes: true,
          employees: true,
          foremen:  true,
        },
      },
    },
  })

  if (!user) return { allowed: false, reason: 'User not found' }

  const plan   = user.plan || 'free'
  const limits = getLimits(plan)

  switch (action) {

    case 'create_paylaw': {
      if (limits.maxPaylaws === -1) return { allowed: true }

      // Count paylaws this month
      const now        = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const count = await prisma.paylaw.count({
        where: {
          userId,
          createdAt: { gte: monthStart },
        },
      })

      if (count >= limits.maxPaylaws) {
        return {
          allowed: false,
          reason: `Free plan allows ${limits.maxPaylaws} paylaws per month. You have used ${count}.`,
          upgrade: 'Upgrade to Starter for unlimited paylaws.',
        }
      }
      return { allowed: true }
    }

    case 'create_overtime': {
      if (!limits.overtime) {
        return {
          allowed: false,
          reason:  'Overtime sheets are not available on the free plan.',
          upgrade: 'Upgrade to Starter to track overtime.',
        }
      }
      return { allowed: true }
    }

    case 'add_worker': {
      if (limits.maxWorkers === -1) return { allowed: true }

      const count = await prisma.employee.count({ where: { userId } })

      if (count >= limits.maxWorkers) {
        return {
          allowed: false,
          reason: `Free plan allows ${limits.maxWorkers} workers. You have ${count}.`,
          upgrade: 'Upgrade to Starter for up to 50 workers.',
        }
      }
      return { allowed: true }
    }

    case 'create_foreman': {
      if (limits.foremen === 0) {
        return {
          allowed: false,
          reason:  'Foreman accounts are not available on the free plan.',
          upgrade: 'Upgrade to Starter to add a foreman.',
        }
      }
      if (limits.foremen === -1) return { allowed: true }

      const count = await prisma.user.count({
        where: { adminId: userId, role: 'foreman' },
      })

      if (count >= limits.foremen) {
        return {
          allowed: false,
          reason: `Starter plan allows ${limits.foremen} foreman account. Upgrade to Pro for unlimited.`,
          upgrade: 'Upgrade to Pro for unlimited foremen.',
        }
      }
      return { allowed: true }
    }

    case 'view_reports': {
      if (!limits.reports) {
        return {
          allowed: false,
          reason:  'Reports are not available on the free plan.',
          upgrade: 'Upgrade to Starter to access reports.',
        }
      }
      return { allowed: true }
    }

    case 'export_excel': {
      if (!limits.excel) {
        return {
          allowed: false,
          reason:  'Excel export is not available on the free plan.',
          upgrade: 'Upgrade to Starter to export to Excel.',
        }
      }
      return { allowed: true }
    }

    default:
      return { allowed: true }
  }
}