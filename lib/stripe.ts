import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export function getPriceId(
  plan: 'starter' | 'pro',
  period: 'monthly' | 'yearly'
): string {
  if (plan === 'starter' && period === 'monthly') {
    return process.env.STRIPE_STARTER_MONTHLY!
  }
  if (plan === 'starter' && period === 'yearly') {
    return process.env.STRIPE_STARTER_YEARLY!
  }
  if (plan === 'pro' && period === 'monthly') {
    return process.env.STRIPE_PRO_MONTHLY!
  }
  if (plan === 'pro' && period === 'yearly') {
    return process.env.STRIPE_PRO_YEARLY!
  }
  throw new Error('Invalid plan or period')
}

export function getPlanFromPriceId(priceId: string): 'starter' | 'pro' {
  if (
    priceId === process.env.STRIPE_STARTER_MONTHLY ||
    priceId === process.env.STRIPE_STARTER_YEARLY
  ) return 'starter'

  if (
    priceId === process.env.STRIPE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRO_YEARLY
  ) return 'pro'

  return 'starter'
}