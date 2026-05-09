import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Foremen see only their site's overtime sheets
  // Admins see all their overtime sheets
  const where = session.user.role === 'foreman'
    ? {
        userId: session.user.adminId!,
        site:   session.user.site!,
      }
    : { userId: session.user.id }

  const overtimes = await prisma.overtime.findMany({
    where,
    include: {
      rows: { include: { employee: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(overtimes)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const {
    site, month, year, preparedBy, status, rows,
  } = await req.json()

  if (!site || !month || !year || !preparedBy) {
    return NextResponse.json(
      { error: 'Site, month, year and preparedBy are required' },
      { status: 400 }
    )
  }

  // Foremen create under the admin's userId
  // so the admin can see everything they create
  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  // Foremen can only create OT sheets for their assigned site
  if (
    session.user.role === 'foreman' &&
    session.user.site &&
    site !== session.user.site
  ) {
    return NextResponse.json(
      { error: 'You can only create overtime sheets for your assigned site' },
      { status: 403 }
    )
  }

  const overtime = await prisma.overtime.create({
    data: {
      site,
      month: parseInt(month),
      year:  parseInt(year),
      preparedBy,
      status: status || 'draft',
      userId: ownerId,
    },
  })

  if (rows && rows.length > 0) {
    await prisma.overtimeRow.createMany({
      data: rows.map((row: {
        employeeId: string
        otRate: number
        totalHours: number
        amount: number
        hours: Record<string, number>
        signature?: string
      }) => ({
        overtimeId: overtime.id,
        employeeId: row.employeeId,
        otRate:     row.otRate,
        totalHours: row.totalHours,
        amount:     row.amount,
        hours:      row.hours,
        signature:  row.signature || '',
      })),
    })
  }

  return NextResponse.json(overtime, { status: 201 })
}