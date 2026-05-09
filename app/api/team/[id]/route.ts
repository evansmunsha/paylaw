import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { id } = await params

  // Make sure this foreman belongs to this admin
  const foreman = await prisma.user.findFirst({
    where: { id, adminId: session.user.id, role: 'foreman' },
  })

  if (!foreman) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ message: 'Removed' })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const { id } = await params
  const { name, site, password } = await req.json()

  const foreman = await prisma.user.findFirst({
    where: { id, adminId: session.user.id, role: 'foreman' },
  })

  if (!foreman) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updateData: Record<string, string> = { name, site }

  // Only update password if provided
  if (password) {
    const { default: bcrypt } = await import('bcryptjs')
    updateData.password = await bcrypt.hash(password, 12)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  })

  return NextResponse.json({
    id:   updated.id,
    name: updated.name,
    site: updated.site,
  })
}