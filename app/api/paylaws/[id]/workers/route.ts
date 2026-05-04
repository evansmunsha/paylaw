import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch just the workers from a paylaw
// so we can copy them into a new one
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id } = await params

  // Security — only fetch if it belongs to this user
  const paylaw = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
    include: {
      rows: {
        include: { employee: true },
      },
    },
  })

  if (!paylaw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Return just the worker info we need
  // not the old attendance — the user will mark fresh
  const workers = paylaw.rows.map(row => ({
    employeeId: row.employeeId,
    name: row.employee.name,
    jobTitle: row.employee.jobTitle,
    dayRate: row.dayRate,
  }))

  return NextResponse.json({
    site: paylaw.site,
    workers,
  })
}