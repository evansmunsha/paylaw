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

  // Find the employee — check it belongs to this user or their admin
  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  const existing = await prisma.employee.findFirst({
    where: { id, userId: ownerId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Foremen can only edit employees at their site
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
      name,
      jobTitle,
      site,
      dayRate: parseFloat(dayRate) || 0,
      otRate:  parseFloat(otRate)  || 0,
      active:  active ?? true,
    },
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

  // Foremen can only delete employees at their site
  if (
    session.user.role === 'foreman' &&
    existing.site !== session.user.site
  ) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  await prisma.employee.delete({ where: { id } })

  return NextResponse.json({ message: 'Deleted' })
}