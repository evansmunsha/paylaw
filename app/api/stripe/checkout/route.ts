import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripeClient, getPriceId } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { plan, period } = await req.json()

  if (!plan || !period) {
    return NextResponse.json(
      { error: 'Plan and period are required' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let customerId = user.stripeCustomerId

  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email:    user.email,
      name:     user.name || undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id

    await prisma.user.update({
      where: { id: user.id },
      data:  { stripeCustomerId: customerId },
    })
  }

  const priceId = getPriceId(
    plan as 'starter' | 'pro',
    period as 'monthly' | 'yearly'
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const checkout = await stripeClient.checkout.sessions.create({
    customer:             customerId,
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url:  `${appUrl}/billing?canceled=true`,
    metadata: { userId: user.id, plan, period },
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
  })

  return NextResponse.json({ url: checkout.url })
}