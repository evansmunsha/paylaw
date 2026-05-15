import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  const existing = await prisma.overtime.findFirst({
    where: { id, userId: ownerId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { site, month, year, preparedBy, status, rows } = await req.json()

  await prisma.overtime.update({
    where: { id },
    data: {
      site,
      month:     parseInt(month),
      year:      parseInt(year),
      preparedBy,
      status:    status || 'draft',
    },
  })

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
        otRate:     row.otRate,
        totalHours: row.totalHours,
        amount:     row.amount,
        hours:      row.hours,
        signature:  row.signature || '',
      })),
    })
  }

  await logAction({
    action:
      status === 'submitted' ? 'submitted' :
      status === 'approved'  ? 'approved'  :
      'updated',
    entityType: 'overtime',
    entityId:   id,
    entityName: `${existing.site} — ${MONTH_NAMES[existing.month - 1]} ${existing.year}`,
    userId:     session.user.id,
    userName:   session.user.name || session.user.email || 'Unknown',
    userRole:   session.user.role || 'admin',
    adminId:    ownerId,
  })

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

  await logAction({
    action:     'deleted',
    entityType: 'overtime',
    entityId:   id,
    entityName: `${existing.site} — ${MONTH_NAMES[existing.month - 1]} ${existing.year}`,
    userId:     session.user.id,
    userName:   session.user.name || session.user.email || 'Unknown',
    userRole:   session.user.role || 'admin',
    adminId:    session.user.id,
  })

  return NextResponse.json({ message: 'Deleted' })
}