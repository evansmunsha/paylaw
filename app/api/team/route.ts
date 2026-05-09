import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET — fetch all foremen created by this admin
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const foremen = await prisma.user.findMany({
    where: { adminId: session.user.id, role: 'foreman' },
    select: {
      id: true, name: true, email: true,
      site: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(foremen)
}

// POST — create a new foreman account
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { name, email, password, site } = await req.json()

  if (!name || !email || !password || !site) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    )
  }

  // Check email not already used
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { error: 'That email is already registered' },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(password, 12)

  const foreman = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role:    'foreman',
      site,
      adminId: session.user.id,
    },
  })

  return NextResponse.json({
    id:    foreman.id,
    name:  foreman.name,
    email: foreman.email,
    site:  foreman.site,
  }, { status: 201 })
}