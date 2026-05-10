import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Foremen see only employees at their site
  // Admin sees all their employees
  const where = session.user.role === 'foreman'
    ? {
        userId: session.user.adminId!,
        site:   session.user.site!,
      }
    : { userId: session.user.id }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(employees)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { name, jobTitle, site, dayRate, otRate } = await req.json()

  if (!name || !jobTitle || !site || !dayRate) {
    return NextResponse.json(
      { error: 'Name, job title, site and day rate are required' },
      { status: 400 }
    )
  }

  // Foremen create employees under the admin's account
  // and can only add to their assigned site
  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  // Foremen cannot add employees to a different site
  if (
    session.user.role === 'foreman' &&
    session.user.site &&
    site !== session.user.site
  ) {
    return NextResponse.json(
      { error: 'You can only add employees to your assigned site' },
      { status: 403 }
    )
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      jobTitle,
      site,
      dayRate:  parseFloat(dayRate)  || 0,
      otRate:   parseFloat(otRate)   || 0,
      userId:   ownerId,
    },
  })

  return NextResponse.json(employee, { status: 201 })
}