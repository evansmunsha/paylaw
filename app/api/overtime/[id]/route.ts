import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.overtime.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { site, month, year, preparedBy, status, rows } = await req.json()

  // Update header
  await prisma.overtime.update({
    where: { id },
    data: {
      site,
      month: parseInt(month),
      year: parseInt(year),
      preparedBy,
      status: status || 'draft',
    },
  })

  // Delete old rows and recreate
  await prisma.overtimeRow.deleteMany({ where: { overtimeId: id } })

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
        overtimeId: id,
        employeeId: row.employeeId,
        otRate: row.otRate,
        totalHours: row.totalHours,
        amount: row.amount,
        hours: row.hours,
        signature: row.signature || '',
      })),
    })
  }

  return NextResponse.json({ message: 'Updated' })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.overtime.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.overtimeRow.deleteMany({ where: { overtimeId: id } })
  await prisma.overtime.delete({ where: { id } })

  return NextResponse.json({ message: 'Deleted' })
}