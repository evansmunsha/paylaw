import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── PATCH — update existing paylaw ───────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  // Security — make sure this paylaw belongs to this user
  const existing = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const {
    site, month, year, preparedBy,
    foodExpense, otherDeduct, status, rows,
  } = await req.json()

  // Step 1 — update the paylaw header
  await prisma.paylaw.update({
    where: { id },
    data: {
      site,
      month: parseInt(month),
      year: parseInt(year),
      preparedBy,
      foodExpense: parseFloat(foodExpense) || 0,
      otherDeduct: parseFloat(otherDeduct) || 0,
      status: status || 'draft',
    },
  })

  // Step 2 — delete all old rows then recreate them
  // This is the simplest way to handle attendance changes
  // without tracking which rows changed
  await prisma.paylawRow.deleteMany({
    where: { paylawId: id },
  })

  if (rows && rows.length > 0) {
    await prisma.paylawRow.createMany({
      data: rows.map((row: {
        employeeId: string
        dayRate: number
        daysWorked: number
        amount: number
        attendance: Record<string, boolean>
        signature?: string
      }) => ({
        paylawId: id,
        employeeId: row.employeeId,
        dayRate: row.dayRate,
        daysWorked: row.daysWorked,
        amount: row.amount,
        attendance: row.attendance,
        signature: row.signature || '',
      })),
    })
  }

  return NextResponse.json({ message: 'Updated' })
}

// ── DELETE — delete a paylaw ─────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete rows first then the paylaw
  await prisma.paylawRow.deleteMany({ where: { paylawId: id } })
  await prisma.paylaw.delete({ where: { id } })

  return NextResponse.json({ message: 'Deleted' })
}