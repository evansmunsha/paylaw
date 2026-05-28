import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, getPlanFromPriceId } from '@/lib/stripe'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // If no Stripe customer — nothing to sync
  if (!user.stripeCustomerId) {
    return NextResponse.json({
      plan: 'free',
      message: 'No Stripe subscription found',
    })
  }

  try {
    // Fetch all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status:   'active',
      limit:    1,
    })

    if (subscriptions.data.length === 0) {
      // Check for past_due or canceled
      const allSubs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit:    1,
      })

      if (allSubs.data.length === 0) {
        // No subscription at all — downgrade to free
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan:      'free',
            subStatus: 'canceled',
          },
        })
        return NextResponse.json({ plan: 'free', synced: true })
      }

      const sub = allSubs.data[0]
      await prisma.user.update({
        where: { id: user.id },
        data:  { subStatus: sub.status },
      })
      return NextResponse.json({ plan: user.plan, synced: true })
    }

    // Active subscription found — update plan
    const sub     = subscriptions.data[0]
    const priceId = sub.items.data[0]?.price.id
    const plan    = getPlanFromPriceId(priceId)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan,
        stripeSubId:         sub.id,
        stripePriceId:       priceId,
        subStatus:           'active',
        subCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    })

    return NextResponse.json({ plan, synced: true })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json(
      { error: 'Could not sync with Stripe' },
      { status: 500 }
    )
  }
}