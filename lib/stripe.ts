import Stripe from 'stripe'

let stripeClient: Stripe | undefined

function getStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }
  return key
}

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeKey(), {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return stripeClient
}

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