import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch settings for this user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // findUnique returns null if no settings yet
  // that is fine — we return empty defaults
  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(settings || {
    companyName: '',
    siteName: '',
    phone: '',
    email: '',
    address: '',
  })
}

// POST — create or update settings
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { companyName, siteName, phone, email, address } = await req.json()

  // upsert = update if exists, create if not
  const settings = await prisma.settings.upsert({
    where: { userId: session.user.id },
    update: { companyName, siteName, phone, email, address },
    create: {
      companyName,
      siteName,
      phone,
      email,
      address,
      userId: session.user.id,
    },
  })

  return NextResponse.json(settings)
}