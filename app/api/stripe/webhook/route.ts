import { NextResponse } from 'next/server'
import { stripeClient, getPlanFromPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: string

  try {
    body = await req.text()
  } catch {
    return NextResponse.json(
      { error: 'Could not read body' },
      { status: 400 }
    )
  }

  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json(
      { error: `Webhook error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('Webhook received:', event.type)

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        const userId = checkoutSession.metadata?.userId

        if (!userId) {
          console.error('No userId in checkout session metadata')
          break
        }

        const sub = await stripeClient.subscriptions.retrieve(
          checkoutSession.subscription as string
        )

        const priceId = sub.items.data[0]?.price.id
        const plan    = getPlanFromPriceId(priceId)

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeSubId:         sub.id,
            stripePriceId:       priceId,
            subStatus:           'active',
            subCurrentPeriodEnd: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000),          },
        })

        console.log('Plan updated to', plan, 'for user', userId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.parent?.subscription_details?.subscription as string
        if (!subId) break

        const sub    = await stripeClient.subscriptions.retrieve(subId)
        const userId = sub.metadata?.userId
        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan    = getPlanFromPriceId(priceId)

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subStatus:           'active',
            subCurrentPeriodEnd: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000),
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // ✅ New - subscription is nested under parent
        const subId = invoice.parent?.subscription_details?.subscription as string
        if (!subId) break

        const sub    = await stripeClient.subscriptions.retrieve(subId)
        const userId = sub.metadata?.userId
        if (!userId) break

        await prisma.user.update({
          where: { id: userId },
          data:  { subStatus: 'past_due' },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

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

      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription
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
            subCurrentPeriodEnd: new Date((sub.items.data[0]?.current_period_end ?? 0) * 1000),
          },
        })
        break
      }
    }
  } catch (err) {
    console.error('Error processing webhook:', err)
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}