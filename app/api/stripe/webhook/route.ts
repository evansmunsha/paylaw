import { NextResponse } from 'next/server'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

// Tell Next.js not to parse the body
// Stripe needs the raw body to verify the webhook
export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json(
      { error: 'Webhook signature failed' },
      { status: 400 }
    )
  }

  // Handle each Stripe event type
  switch (event.type) {

    // ── Payment succeeded — activate the subscription ──
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId  = session.metadata?.userId

      if (!userId) break

      const sub: any = await stripe.subscriptions.retrieve(
        session.subscription as string
      )

      const priceId = sub.items.data[0]?.price.id
      const plan    = getPlanFromPriceId(priceId)

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          stripeSubId:          sub.id,
          stripePriceId:        priceId,
          subStatus:            'active',
          subCurrentPeriodEnd:  new Date((sub as any).current_period_end * 1000),
        },
      })

      break
    }

    // ── Subscription renewed — keep it active ──────────
    case 'invoice.paid': {
      const invoice = event.data.object as any
      const subId   = invoice.subscription as string

      if (!subId) break

      const sub: any = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata?.userId

      if (!userId) break

      const priceId = sub.items.data[0]?.price.id
      const plan    = getPlanFromPriceId(priceId)

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          subStatus:           'active',
          subCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        },
      })

      break
    }

    // ── Payment failed — mark as past due ──────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as any
      const subId   = invoice.subscription as string

      if (!subId) break

      const sub: any = await stripe.subscriptions.retrieve(subId)
      const userId = sub.metadata?.userId

      if (!userId) break

      await prisma.user.update({
        where: { id: userId },
        data:  { subStatus: 'past_due' },
      })

      break
    }

    // ── Subscription cancelled ─────────────────────────
    case 'customer.subscription.deleted': {
      const sub    = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId

      if (!userId) break

      // Downgrade to free plan
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan:                'free',
          stripeSubId:         null,
          stripePriceId:       null,
          subStatus:           'canceled',
          subCurrentPeriodEnd: null,
        },
      })

      break
    }

    // ── Plan changed (upgrade or downgrade) ───────────
    case 'customer.subscription.updated': {
      const sub: any = event.data.object
      const userId = sub.metadata?.userId

      if (!userId) break

      const priceId = sub.items.data[0]?.price.id
      const plan    = getPlanFromPriceId(priceId)

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan,
          stripePriceId:       priceId,
          subStatus:           sub.status === 'active' ? 'active' : 'past_due',
          subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      })

      break
    }
  }

  return NextResponse.json({ received: true })
}