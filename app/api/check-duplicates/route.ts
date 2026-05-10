import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { employeeIds, month, year, site } = await req.json()

  const ownerId = session.user.role === 'foreman'
    ? session.user.adminId!
    : session.user.id

  // Find any existing paylaw rows for these employees
  // in the same month and year but a DIFFERENT site
  const existing = await prisma.paylawRow.findMany({
    where: {
      employeeId: { in: employeeIds },
      paylaw: {
        userId: ownerId,
        month:  parseInt(month),
        year:   parseInt(year),
        // Different site means this worker is double-counted
        site:   { not: site },
      },
    },
    include: {
      employee: { select: { name: true } },
      paylaw:   { select: { site: true } },
    },
  })

  if (existing.length === 0) {
    return NextResponse.json({ duplicates: [] })
  }

  // Return names of workers that are duplicated
  const duplicates = existing.map(
    r => `${r.employee.name} (already at ${r.paylaw.site})`
  )

  return NextResponse.json({ duplicates })
}