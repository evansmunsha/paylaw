import { NextResponse } from 'next/server'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

// This is critical — tell Next.js not to parse the body
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
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
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
        const checkoutSession = event.data.object as Stripe.CheckoutSession
        const userId = checkoutSession.metadata?.userId

        console.log('checkout.session.completed — userId:', userId)

        if (!userId) {
          console.error('No userId in checkout session metadata')
          break
        }

        const sub = await stripe.subscriptions.retrieve(
          checkoutSession.subscription as string
        )

        const priceId = sub.items.data[0]?.price.id
        const plan    = getPlanFromPriceId(priceId)

        console.log('Updating user plan to:', plan)

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeSubId:         sub.id,
            stripePriceId:       priceId,
            subStatus:           'active',
            subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })

        console.log('Plan updated successfully for user:', userId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break

        const sub    = await stripe.subscriptions.retrieve(subId)
        const userId = sub.metadata?.userId
        if (!userId) break

        const priceId = sub.items.data[0]?.price.id
        const plan    = getPlanFromPriceId(priceId)

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subStatus:           'active',
            subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string
        if (!subId) break

        const sub    = await stripe.subscriptions.retrieve(subId)
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
            subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })
        break
      }
    }
  } catch (err) {
    console.error('Error processing webhook:', err)
    // Still return 200 so Stripe does not retry
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }

  return NextResponse.json({ received: true })
}