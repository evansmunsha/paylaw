import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── GET — fetch all employees for this user ──────────
export async function GET() {
  const session = await getServerSession(authOptions)

  // If not logged in, reject the request
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const employees = await prisma.employee.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(employees)
}

// ── POST — create a new employee ─────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { name, jobTitle, site, dayRate, otRate } = await req.json()

  // Make sure nothing important is missing
  if (!name || !jobTitle || !site || !dayRate || !otRate) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    )
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      jobTitle,
      site,
      dayRate: parseFloat(dayRate),  // make sure it is a number not a string
      otRate: parseFloat(otRate),
      userId: session.user.id,
    },
  })

  return NextResponse.json(employee, { status: 201 })
}