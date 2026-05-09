import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const { email, password, name, companyName } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check no account already exists with this email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with that email already exists' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    // Every person who signs up becomes an admin
    // of their own separate company account
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'admin',
      },
    })

    // If they provided a company name during signup
    // save it to their settings automatically
    if (companyName) {
      await prisma.settings.create({
        data: {
          companyName,
          userId: user.id,
          siteName: '',
          phone: '',
          email: '',
          address: '',
        },
      })
    }

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}