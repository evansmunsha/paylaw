import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    // 1. Get the data sent from the form
    const { email, password, name } = await req.json()

    // 2. Make sure nothing is empty
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 3. Check if that email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with that email already exists' },
        { status: 400 }
      )
    }

    // 4. Hash the password — NEVER save a plain text password
    // The number 12 is the "salt rounds" — higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, 12)

    // 5. Save the new user to the database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })

    // 6. Return success (don't send the password back!)
    return NextResponse.json(
      { message: 'Account created', userId: user.id },
      { status: 201 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}