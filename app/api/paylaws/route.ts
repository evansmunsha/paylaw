import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Foremen see only their site's paylaws
  // Admins see all their paylaws
  const where = session.user.role === 'foreman'
    ? {
        userId: session.user.adminId!, // foreman's data lives under admin
        site:   session.user.site!,
      }
    : { userId: session.user.id }

  const paylaws = await prisma.paylaw.findMany({
    where,
    include: { rows: { include: { employee: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(paylaws)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const {
    site, month, year, preparedBy,
    foodExpense, otherDeduct, status, rows,
  } = await req.json()

  if (!site || !month || !year || !preparedBy) {
    return NextResponse.json(
      { error: 'Site, month, year and preparedBy are required' },
      { status: 400 }
    )
  }

  // Foremen create under the admin's userId
  // so the admin can see everything
  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  // Foremen can only create paylaws for their assigned site
  if (
    session.user.role === 'foreman' &&
    session.user.site &&
    site !== session.user.site
  ) {
    return NextResponse.json(
      { error: 'You can only create paylaws for your assigned site' },
      { status: 403 }
    )
  }

  const paylaw = await prisma.paylaw.create({
    data: {
      site,
      month: parseInt(month),
      year: parseInt(year),
      preparedBy,
      foodExpense: parseFloat(foodExpense) || 0,
      otherDeduct: parseFloat(otherDeduct) || 0,
      status: status || 'draft',
      userId: ownerId,
    },
  })

  if (rows && rows.length > 0) {
    await prisma.paylawRow.createMany({
      data: rows.map((row: {
        employeeId: string
        dayRate: number
        daysWorked: number
        amount: number
        deduction: number
        netAmount: number
        attendance: Record<string, boolean>
        signature?: string
      }) => ({
        paylawId:   paylaw.id,
        employeeId: row.employeeId,
        dayRate:    row.dayRate,
        daysWorked: row.daysWorked,
        amount:     row.amount,
        deduction:  row.deduction  || 0,
        netAmount:  row.netAmount  || row.amount,
        attendance: row.attendance,
        signature:  row.signature  || '',
      })),
    })
  }

  return NextResponse.json(paylaw, { status: 201 })
}