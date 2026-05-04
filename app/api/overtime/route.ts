import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const overtimes = await prisma.overtime.findMany({
    where: { userId: session.user.id },
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

  // Step 1 — create the overtime sheet header
  const overtime = await prisma.overtime.create({
    data: {
      site,
      month: parseInt(month),
      year: parseInt(year),
      preparedBy,
      status: status || 'draft',
      userId: session.user.id,
    },
  })

  // Step 2 — create each worker row
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
        otRate: row.otRate,
        totalHours: row.totalHours,
        amount: row.amount,
        hours: row.hours,
        signature: row.signature || '',
      })),
    })
  }

  return NextResponse.json(overtime, { status: 201 })
}