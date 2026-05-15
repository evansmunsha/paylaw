import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — mark one notification as read
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data:  { read: true },
  })

  return NextResponse.json({ message: 'Marked as read' })
}