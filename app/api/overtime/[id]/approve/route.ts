import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'
import { notify } from '@/lib/notify'

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

  const { id }           = await params
  const { action, note } = await req.json()

  const overtime = await prisma.overtime.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!overtime) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'approve') {
    await prisma.overtime.update({
      where: { id },
      data:  { status: 'approved' },
    })

    // Find the foreman who submitted this and notify them
    const submitLog = await prisma.auditLog.findFirst({
      where: { entityId: id, action: 'submitted' },
      orderBy: { createdAt: 'desc' },
    })

    if (submitLog && submitLog.userId !== session.user.id) {
      await notify({
        userId:     submitLog.userId,
        title:      '✅ Overtime Approved',
        message:    `Your overtime sheet for ${overtime.site} — ${MONTH_NAMES[overtime.month - 1]} ${overtime.year} has been approved.`,
        type:       'approved',
        entityType: 'overtime',
        entityId:   id,
      })
    }

    await logAction({
      action:     'approved',
      entityType: 'overtime',
      entityId:   id,
      entityName: `${overtime.site} — ${MONTH_NAMES[overtime.month - 1]} ${overtime.year}`,
      userId:     session.user.id,
      userName:   session.user.name || session.user.email || 'Unknown',
      userRole:   'admin',
      adminId:    session.user.id,
    })

    return NextResponse.json({ message: 'Approved' })
  }

  if (action === 'reject') {
    await prisma.overtime.update({
      where: { id },
      data:  {
        status: 'rejected',
      },
    })

    const submitLog = await prisma.auditLog.findFirst({
      where: { entityId: id, action: 'submitted' },
      orderBy: { createdAt: 'desc' },
    })

    if (submitLog && submitLog.userId !== session.user.id) {
      await notify({
        userId:     submitLog.userId,
        title:      '❌ Overtime Rejected',
        message:    `Your overtime sheet for ${overtime.site} — ${MONTH_NAMES[overtime.month - 1]} ${overtime.year} was rejected. Reason: ${note || 'No reason given'}. Please fix and resubmit.`,
        type:       'rejected',
        entityType: 'overtime',
        entityId:   id,
      })
    }

    await logAction({
      action:     'rejected',
      entityType: 'overtime',
      entityId:   id,
      entityName: `${overtime.site} — ${MONTH_NAMES[overtime.month - 1]} ${overtime.year}`,
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