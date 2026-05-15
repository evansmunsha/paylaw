import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(settings || {
    companyName: '',
    siteName:    '',
    phone:       '',
    email:       '',
    address:     '',
    currency:    'ZMW',
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const {
    companyName, siteName, phone,
    email, address, currency,
  } = await req.json()

  const settings = await prisma.settings.upsert({
    where:  { userId: session.user.id },
    update: { companyName, siteName, phone, email, address, currency },
    create: {
      companyName,
      siteName,
      phone,
      email,
      address,
      currency:  currency || 'ZMW',
      userId:    session.user.id,
    },
  })

  return NextResponse.json(settings)
}