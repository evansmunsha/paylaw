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

  const existing = await prisma.paylaw.findFirst({
    where: { id, userId: ownerId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const {
    site, month, year, preparedBy,
    foodExpense, otherDeduct, status, rows,
  } = await req.json()

  await prisma.paylaw.update({
    where: { id },
    data: {
      site,
      month:       parseInt(month),
      year:        parseInt(year),
      preparedBy,
      foodExpense: parseFloat(foodExpense) || 0,
      otherDeduct: parseFloat(otherDeduct) || 0,
      status:      status || 'draft',
    },
  })

  await prisma.paylawRow.deleteMany({ where: { paylawId: id } })

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
        paylawId:   id,
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

  // Log the action
  await logAction({
    action:
      status === 'submitted' ? 'submitted' :
      status === 'approved'  ? 'approved'  :
      'updated',
    entityType: 'paylaw',
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

  const existing = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.paylawRow.deleteMany({ where: { paylawId: id } })
  await prisma.paylaw.delete({ where: { id } })

  // Log the action
  await logAction({
    action:     'deleted',
    entityType: 'paylaw',
    entityId:   id,
    entityName: `${existing.site} — ${MONTH_NAMES[existing.month - 1]} ${existing.year}`,
    userId:     session.user.id,
    userName:   session.user.name || session.user.email || 'Unknown',
    userRole:   session.user.role || 'admin',
    adminId:    session.user.id,
  })

  return NextResponse.json({ message: 'Deleted' })
}