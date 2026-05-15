import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit'

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

  const existing = await prisma.employee.findFirst({
    where: { id, userId: ownerId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    session.user.role === 'foreman' &&
    existing.site !== session.user.site
  ) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { name, jobTitle, site, dayRate, otRate, active } = await req.json()

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name:    name    ?? existing.name,
      jobTitle: jobTitle ?? existing.jobTitle,
      site:    site    ?? existing.site,
      dayRate: parseFloat(dayRate) || existing.dayRate,
      otRate:  parseFloat(otRate)  || existing.otRate,
      active:  active  ?? existing.active,
    },
  })

  await logAction({
    action:     'updated',
    entityType: 'employee',
    entityId:   id,
    entityName: `${employee.name} — ${employee.site}`,
    userId:     session.user.id,
    userName:   session.user.name || session.user.email || 'Unknown',
    userRole:   session.user.role || 'admin',
    adminId:    ownerId,
  })

  return NextResponse.json(employee)
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

  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  const existing = await prisma.employee.findFirst({
    where: { id, userId: ownerId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (
    session.user.role === 'foreman' &&
    existing.site !== session.user.site
  ) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  await prisma.employee.delete({ where: { id } })

  await logAction({
    action:     'deleted',
    entityType: 'employee',
    entityId:   id,
    entityName: `${existing.name} — ${existing.site}`,
    userId:     session.user.id,
    userName:   session.user.name || session.user.email || 'Unknown',
    userRole:   session.user.role || 'admin',
    adminId:    ownerId,
  })

  return NextResponse.json({ message: 'Deleted' })
}