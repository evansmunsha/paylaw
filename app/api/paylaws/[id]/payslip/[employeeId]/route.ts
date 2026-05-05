import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { id, employeeId } = await params

  // Fetch the paylaw — security check
  const paylaw = await prisma.paylaw.findFirst({
    where: { id, userId: session.user.id },
    include: {
      rows: {
        where: { employeeId },
        include: { employee: true },
      },
    },
  })

  if (!paylaw || paylaw.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const row = paylaw.rows[0]

  // Check if this worker has overtime for the same month and year
  const overtimeRow = await prisma.overtimeRow.findFirst({
    where: {
      employeeId,
      overtime: {
        userId: session.user.id,
        month: paylaw.month,
        year: paylaw.year,
      },
    },
    include: { overtime: true },
  })

  // Fetch company settings
  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({
    // Worker info
    workerName:  row.employee.name,
    jobTitle:    row.employee.jobTitle,
    site:        paylaw.site,
    month:       paylaw.month,
    year:        paylaw.year,
    preparedBy:  paylaw.preparedBy,

    // Normal pay
    dayRate:     row.dayRate,
    daysWorked:  row.daysWorked,
    grossPay:    row.amount,
    deduction:   row.deduction  || 0,
    netPay:      row.netAmount  || row.amount,
    attendance:  row.attendance,

    // Overtime — 0 if none
    otHours:  overtimeRow?.totalHours || 0,
    otRate:   overtimeRow?.otRate     || 0,
    otPay:    overtimeRow?.amount     || 0,

    // Company
    company: settings ? {
      companyName: settings.companyName,
      phone:       settings.phone,
      email:       settings.email,
      address:     settings.address,
    } : undefined,
  })
}