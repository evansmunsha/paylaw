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

  const { id }          = await params
  const { action, note } = await req.json()

  if (action === 'reject' && (!note || !note.trim())) {
    return NextResponse.json({ error: 'Rejection note is required' }, { status: 400 })
  }

  const paylaw = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!paylaw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (action === 'approve') {
    await prisma.paylaw.update({
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
        title:      '✅ Paylaw Approved',
        message:    `Your paylaw for ${paylaw.site} — ${MONTH_NAMES[paylaw.month - 1]} ${paylaw.year} has been approved. The PDF is now ready to download.`,
        type:       'approved',
        entityType: 'paylaw',
        entityId:   id,
      })
    }

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
        title:      '❌ Paylaw Rejected',
        message:    `Your paylaw for ${paylaw.site} — ${MONTH_NAMES[paylaw.month - 1]} ${paylaw.year} was rejected. Reason: ${note || 'No reason given'}. Please fix and resubmit.`,
        type:       'rejected',
        entityType: 'paylaw',
        entityId:   id,
      })
    }

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