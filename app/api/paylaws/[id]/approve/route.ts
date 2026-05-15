import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { id }          = await params
  const { action, note } = await req.json()

  const paylaw = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!paylaw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'approve') {
    await prisma.paylaw.update({
      where: { id },
      data:  { status: 'approved', rejectionNote: null },
    })

    await logAction({
      action:     'approved',
      entityType: 'paylaw',
      entityId:   id,
      entityName: `${paylaw.site} — ${MONTH_NAMES[paylaw.month - 1]} ${paylaw.year}`,
      userId:     session.user.id,
      userName:   session.user.name || session.user.email || 'Unknown',
      userRole:   'admin',
      adminId:    session.user.id,
    })

    return NextResponse.json({ message: 'Approved' })
  }

  if (action === 'reject') {
    await prisma.paylaw.update({
      where: { id },
      data:  {
        status:        'rejected',
        rejectionNote: note || 'No reason provided',
      },
    })

    await logAction({
      action:     'rejected',
      entityType: 'paylaw',
      entityId:   id,
      entityName: `${paylaw.site} — ${MONTH_NAMES[paylaw.month - 1]} ${paylaw.year}`,
      userId:     session.user.id,
      userName:   session.user.name || session.user.email || 'Unknown',
      userRole:   'admin',
      adminId:    session.user.id,
      details:    `Reason: ${note}`,
    })

    return NextResponse.json({ message: 'Rejected' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}