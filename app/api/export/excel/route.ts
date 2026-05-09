import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type  = searchParams.get('type') || 'monthly'
  const month = parseInt(searchParams.get('month') || '0')
  const year  = parseInt(searchParams.get('year')  || String(new Date().getFullYear()))

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]

  // ── Fetch data ───────────────────────────────────────
  const paylawWhere = type === 'ytd'
    ? { userId: session.user.id, year }
    : { userId: session.user.id, month, year }

  const overtimeWhere = type === 'ytd'
    ? { userId: session.user.id, year }
    : { userId: session.user.id, month, year }

  const [paylaws, overtimes] = await Promise.all([
    prisma.paylaw.findMany({
      where: paylawWhere,
      include: { rows: { include: { employee: true } } },
      orderBy: [{ month: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.overtime.findMany({
      where: overtimeWhere,
      include: { rows: { include: { employee: true } } },
      orderBy: [{ month: 'asc' }, { createdAt: 'asc' }],
    }),
  ])

  // ── Build workbook ───────────────────────────────────
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Worker summary ──────────────────────────
  const workerMap: Record<string, {
    name: string
    jobTitle: string
    site: string
    months: string[]
    totalDays: number
    grossPay: number
    deductions: number
    netPay: number
    otHours: number
    otPay: number
  }> = {}

  for (const p of paylaws) {
    for (const row of p.rows) {
      const id = row.employeeId
      if (!workerMap[id]) {
        workerMap[id] = {
          name: row.employee.name,
          jobTitle: row.employee.jobTitle,
          site: p.site,
          months: [],
          totalDays: 0,
          grossPay: 0,
          deductions: 0,
          netPay: 0,
          otHours: 0,
          otPay: 0,
        }
      }
      const mName = MONTH_NAMES[p.month - 1]
      if (!workerMap[id].months.includes(mName)) {
        workerMap[id].months.push(mName)
      }
      workerMap[id].totalDays  += row.daysWorked || 0
      workerMap[id].grossPay   += row.amount     || 0
      workerMap[id].deductions += row.deduction  || 0
      workerMap[id].netPay     += row.netAmount  || row.amount || 0
    }
  }

  for (const o of overtimes) {
    for (const row of o.rows) {
      const id = row.employeeId
      if (workerMap[id]) {
        workerMap[id].otHours += row.totalHours || 0
        workerMap[id].otPay   += row.amount     || 0
      }
    }
  }

  const summaryRows = [
    // Header row
    [
      'Name', 'Job Title', 'Site',
      type === 'ytd' ? 'Months Active' : 'Month',
      'Days Worked', 'Gross Pay (K)', 'Deductions (K)',
      'Net Pay (K)', 'OT Hours', 'OT Pay (K)',
      'Total Earned (K)',
    ],
    // Data rows
    ...Object.values(workerMap).map(w => [
      w.name,
      w.jobTitle,
      w.site,
      type === 'ytd' ? w.months.join(', ') : MONTH_NAMES[month - 1],
      w.totalDays,
      w.grossPay,
      w.deductions,
      w.netPay,
      w.otHours,
      w.otPay,
      w.netPay + w.otPay,
    ]),
    // Empty row
    [],
    // Totals row
    [
      'TOTAL', '', '', '',
      Object.values(workerMap).reduce((t, w) => t + w.totalDays, 0),
      Object.values(workerMap).reduce((t, w) => t + w.grossPay, 0),
      Object.values(workerMap).reduce((t, w) => t + w.deductions, 0),
      Object.values(workerMap).reduce((t, w) => t + w.netPay, 0),
      Object.values(workerMap).reduce((t, w) => t + w.otHours, 0),
      Object.values(workerMap).reduce((t, w) => t + w.otPay, 0),
      Object.values(workerMap).reduce((t, w) => t + w.netPay + w.otPay, 0),
    ],
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)

  // Column widths
  wsSummary['!cols'] = [
    { wch: 20 }, // Name
    { wch: 16 }, // Job title
    { wch: 18 }, // Site
    { wch: 20 }, // Month/months
    { wch: 12 }, // Days
    { wch: 14 }, // Gross
    { wch: 14 }, // Deductions
    { wch: 14 }, // Net
    { wch: 10 }, // OT hours
    { wch: 12 }, // OT pay
    { wch: 14 }, // Total
  ]

  XLSX.utils.book_append_sheet(wb, wsSummary, 'Worker Summary')

  // ── Sheet 2: Monthly breakdown ───────────────────────
  const monthlyRows: (string | number)[][] = [
    ['Month', 'Site', 'Workers', 'Days Worked',
     'Normal Pay (K)', 'OT Pay (K)', 'Food & Expenses (K)', 'Total (K)'],
  ]

  for (const p of paylaws) {
    const totalNormal = p.rows.reduce(
      (t, r) => t + (r.netAmount || r.amount || 0), 0
    )
    const matchingOT = overtimes.filter(
      o => o.month === p.month && o.site === p.site
    )
    const totalOT = matchingOT.reduce(
      (t, o) => t + o.rows.reduce((s, r) => s + r.amount, 0), 0
    )
    const food = p.foodExpense + p.otherDeduct

    monthlyRows.push([
      MONTH_NAMES[p.month - 1],
      p.site,
      p.rows.length,
      p.rows.reduce((t, r) => t + r.daysWorked, 0),
      totalNormal,
      totalOT,
      food,
      totalNormal + totalOT + food,
    ])
  }

  const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyRows)
  wsMonthly['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 12 },
    { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
  ]

  XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Breakdown')

  // ── Sheet 3: Paylaw details ──────────────────────────
  const paylawRows: (string | number)[][] = [
    ['Month', 'Site', 'Worker Name', 'Job Title', 'Day Rate (K)',
     'Days Worked', 'Gross Pay (K)', 'Deduction (K)', 'Net Pay (K)',
     'Signature'],
  ]

  for (const p of paylaws) {
    for (const row of p.rows) {
      paylawRows.push([
        MONTH_NAMES[p.month - 1],
        p.site,
        row.employee.name,
        row.employee.jobTitle,
        row.dayRate,
        row.daysWorked,
        row.amount,
        row.deduction  || 0,
        row.netAmount  || row.amount,
        row.signature  || '',
      ])
    }
  }

  const wsPaylaw = XLSX.utils.aoa_to_sheet(paylawRows)
  wsPaylaw['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 16 },
    { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, wsPaylaw, 'Paylaw Details')

  // ── Sheet 4: Overtime details ────────────────────────
  const otRows: (string | number)[][] = [
    ['Month', 'Site', 'Worker Name', 'Job Title',
     'OT Rate (K/hr)', 'Total Hours', 'OT Pay (K)', 'Signature'],
  ]

  for (const o of overtimes) {
    for (const row of o.rows) {
      otRows.push([
        MONTH_NAMES[o.month - 1],
        o.site,
        row.employee.name,
        row.employee.jobTitle,
        row.otRate,
        row.totalHours,
        row.amount,
        row.signature || '',
      ])
    }
  }

  const wsOT = XLSX.utils.aoa_to_sheet(otRows)
  wsOT['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 16 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, wsOT, 'Overtime Details')

  // ── Generate Excel buffer ────────────────────────────
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // ── Build filename ───────────────────────────────────
  const label = type === 'ytd'
    ? `YTD_${year}`
    : `${MONTH_NAMES[month - 1]}_${year}`

  const filename = `PayLaw_Export_${label}.xlsx`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}