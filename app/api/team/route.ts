import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { name, email, password, site } = await req.json()

  if (!name || !email || !password || !site) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    // If this foreman already belongs to this admin — just update them
    if (existing.adminId === session.user.id && existing.role === 'foreman') {
      const hashed = await bcrypt.hash(password, 12)
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: { name, site, password: hashed },
      })
      return NextResponse.json({
        id:    updated.id,
        name:  updated.name,
        email: updated.email,
        site:  updated.site,
      }, { status: 200 })
    }

    // Email belongs to a completely different account — block it
    return NextResponse.json(
      {
        error: email === session.user.email
          ? 'That is your own admin email. Use a different email for the foreman.'
          : 'That email is already used by another account. Use a different email for this foreman.',
      },
      { status: 400 }
    )
  }

  // Create brand new foreman account
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