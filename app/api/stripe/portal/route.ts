import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripeClient } from '@/lib/stripe'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No subscription found' },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const portal = await stripeClient.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: portal.url })
}