import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || '0')
  const year  = parseInt(searchParams.get('year')  || '0')

  if (!month || !year) {
    return NextResponse.json(
      { error: 'Month and year are required' },
      { status: 400 }
    )
  }

  const [paylaws, overtimes, settings] = await Promise.all([
    prisma.paylaw.findMany({
      where: { userId: session.user.id, month, year },
      include: {
        rows: { include: { employee: true } },
      },
    }),
    prisma.overtime.findMany({
      where: { userId: session.user.id, month, year },
      include: {
        rows: { include: { employee: true } },
      },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  // Build site map combining paylaws and overtime
  const siteMap: Record<string, {
    workers: Record<string, {
      name: string
      jobTitle: string
      daysWorked: number
      grossPay: number
      deduction: number
      netPay: number
      otHours: number
      otPay: number
    }>
    foodExpense: number
    otherDeduct: number
  }> = {}

  for (const p of paylaws) {
    if (!siteMap[p.site]) {
      siteMap[p.site] = {
        workers: {},
        foodExpense: 0,
        otherDeduct: 0,
      }
    }
    siteMap[p.site].foodExpense += p.foodExpense || 0
    siteMap[p.site].otherDeduct += p.otherDeduct || 0

    for (const row of p.rows) {
      const id = row.employeeId
      if (!siteMap[p.site].workers[id]) {
        siteMap[p.site].workers[id] = {
          name:      row.employee.name,
          jobTitle:  row.employee.jobTitle,
          daysWorked: 0,
          grossPay:   0,
          deduction:  0,
          netPay:     0,
          otHours:    0,
          otPay:      0,
        }
      }
      siteMap[p.site].workers[id].daysWorked += row.daysWorked || 0
      siteMap[p.site].workers[id].grossPay   += row.amount     || 0
      siteMap[p.site].workers[id].deduction  += row.deduction  || 0
      siteMap[p.site].workers[id].netPay     += row.netAmount  || row.amount || 0
    }
  }

  for (const o of overtimes) {
    if (!siteMap[o.site]) {
      siteMap[o.site] = {
        workers: {},
        foodExpense: 0,
        otherDeduct: 0,
      }
    }
    for (const row of o.rows) {
      const id = row.employeeId
      if (siteMap[o.site].workers[id]) {
        siteMap[o.site].workers[id].otHours += row.totalHours || 0
        siteMap[o.site].workers[id].otPay   += row.amount     || 0
      }
    }
  }

  const sites = Object.entries(siteMap).map(([site, data]) => ({
    site,
    workers: Object.values(data.workers),
    foodExpense: data.foodExpense,
    otherDeduct: data.otherDeduct,
  }))

  // Get preparedBy from the first paylaw or settings
  const preparedBy = paylaws[0]?.preparedBy
    || settings?.companyName
    || 'Administrator'

  return NextResponse.json({
    month,
    year,
    preparedBy,
    sites,
    company: settings ? {
      companyName: settings.companyName,
      phone:       settings.phone,
      email:       settings.email,
      address:     settings.address,
    } : undefined,
  })
}