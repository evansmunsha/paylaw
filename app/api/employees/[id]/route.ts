import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ── PATCH — update an employee ───────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // In Next.js 15 params is a Promise — must await it first
  const { id } = await params

  const { name, jobTitle, site, dayRate, otRate, active } = await req.json()

  const existing = await prisma.employee.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      name,
      jobTitle,
      site,
      dayRate: parseFloat(dayRate),
      otRate: parseFloat(otRate),
      active,
    },
  })

  return NextResponse.json(updated)
}

// ── DELETE — remove an employee ──────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  // Await params before using id
  const { id } = await params

  const existing = await prisma.employee.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.employee.delete({
    where: { id },
  })

  return NextResponse.json({ message: 'Deleted' })
}