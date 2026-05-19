export type Plan = 'free' | 'starter' | 'pro'

export interface PlanLimits {
  maxSites:     number   // -1 means unlimited
  maxWorkers:   number
  maxPaylaws:   number   // per month, -1 unlimited
  overtime:     boolean
  foremen:      number   // max foreman accounts, -1 unlimited
  reports:      boolean
  excel:        boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxSites:   1,
    maxWorkers: 10,
    maxPaylaws: 3,
    overtime:   false,
    foremen:    0,
    reports:    false,
    excel:      false,
  },
  starter: {
    maxSites:   3,
    maxWorkers: 50,
    maxPaylaws: -1,
    overtime:   true,
    foremen:    1,
    reports:    true,
    excel:      true,
  },
  pro: {
    maxSites:   -1,
    maxWorkers: -1,
    maxPaylaws: -1,
    overtime:   true,
    foremen:    -1,
    reports:    true,
    excel:      true,
  },
}

export const PLAN_PRICES = {
  starter: {
    monthly: { price: 9,  label: '$9 / month',  period: 'monthly' },
    yearly:  { price: 90, label: '$90 / year',   period: 'yearly',
               saving: 'Save $18' },
  },
  pro: {
    monthly: { price: 19,  label: '$19 / month', period: 'monthly' },
    yearly:  { price: 190, label: '$190 / year', period: 'yearly',
               saving: 'Save $38' },
  },
}

export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as Plan] || PLAN_LIMITS.free
}

export function canDo(
  plan: string,
  action: keyof PlanLimits
): boolean {
  const limits = getLimits(plan)
  const value  = limits[action]
  if (typeof value === 'boolean') return value
  return value === -1 || (value as number) > 0
}