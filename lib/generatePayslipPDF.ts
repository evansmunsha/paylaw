import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencySymbol, formatMoney } from './currency'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

interface CompanySettings {
  companyName: string
  phone: string
  email: string
  address: string
}

interface PayslipData {
  // Worker info
  workerName: string
  jobTitle: string
  site: string
  month: number
  year: number
  preparedBy: string

  // Normal pay
  dayRate: number
  daysWorked: number
  grossPay: number
  deduction: number
  netPay: number
  attendance: Record<string, boolean>

  // Overtime (optional — if worker has OT that month)
  otHours: number
  otRate: number
  otPay: number

  company?: CompanySettings
}

export function generatePayslipPDF(data: PayslipData, currency: string = 'ZMW') {
  // Portrait A5 — compact and personal like a real payslip
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  })

  const pageW       = doc.internal.pageSize.getWidth()
  const monthName   = MONTH_NAMES[data.month - 1]
  const daysInMonth = new Date(data.year, data.month, 0).getDate()
  const company     = data.company
  const symbol      = getCurrencySymbol(currency)

  // ── Colours ───────────────────────────────────────────
  const BLACK       = [17,  24,  39]  as [number,number,number]
  const GREEN_DARK  = [21, 128,  61]  as [number,number,number]
  const GREEN_LIGHT = [240,253,244]   as [number,number,number]
  const RED_DARK    = [185, 28,  28]  as [number,number,number]
  const RED_LIGHT   = [254,242,242]   as [number,number,number]
  const AMBER_DARK  = [146, 64,  14]  as [number,number,number]
  const AMBER_LIGHT = [255,251,235]   as [number,number,number]
  const GRAY_MID    = [107,114,128]   as [number,number,number]
  const GRAY_LIGHT  = [243,244,246]   as [number,number,number]
  const WHITE       = [255,255,255]   as [number,number,number]
  const BORDER      = [209,213,219]   as [number,number,number]

  let y = 10

  // ── Company header ────────────────────────────────────
  if (company?.companyName) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(company.companyName, pageW / 2, y, { align: 'center' })
    y += 5
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('PAY SLIP', pageW / 2, y, { align: 'center' })
  y += 5

  if (company) {
    const parts = [company.phone, company.email, company.address].filter(Boolean)
    if (parts.length > 0) {
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY_MID)
      doc.text(parts.join('  |  '), pageW / 2, y, { align: 'center' })
      y += 4
    }
  }

  // Divider
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.5)
  doc.line(8, y, pageW - 8, y)
  y += 4

  // ── Worker info box ───────────────────────────────────
  // Left column
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('EMPLOYEE', 10, y)
  doc.text('JOB TITLE', 10, y + 6)
  doc.text('SITE', 10, y + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BLACK)
  doc.text(data.workerName, 38, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MID)
  doc.text(data.jobTitle, 38, y + 6)
  doc.text(data.site, 38, y + 12)

  // Right column
  const rightX = pageW / 2 + 4
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('PAY PERIOD', rightX, y)
  doc.text('DAY RATE', rightX, y + 6)
  doc.text('PREPARED BY', rightX, y + 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...BLACK)
  doc.text(`${monthName} ${data.year}`, rightX + 24, y)
  doc.text(`${symbol} ${data.dayRate}/day`, rightX + 24, y + 6)
  doc.text(data.preparedBy, rightX + 24, y + 12)

  y += 18

  // Light divider
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.line(8, y, pageW - 8, y)
  y += 4

  // ── Attendance mini calendar ──────────────────────────
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('ATTENDANCE — ' + monthName.toUpperCase() + ' ' + data.year, 10, y)
  y += 3

  // Build calendar grid — 7 columns wide
  const cellW     = (pageW - 16) / 7
  const cellH     = 5
  const calStartX = 8

  // Day name headers
  const dayNamesShort = ['Su','Mo','Tu','We','Th','Fr','Sa']
  dayNamesShort.forEach((d, i) => {
    const x = calStartX + i * cellW + cellW / 2
    doc.setFontSize(6)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(i === 0 || i === 6 ? AMBER_DARK[0] : GRAY_MID[0],
                     i === 0 || i === 6 ? AMBER_DARK[1] : GRAY_MID[1],
                     i === 0 || i === 6 ? AMBER_DARK[2] : GRAY_MID[2])
    doc.text(d, x, y + 3, { align: 'center' })
  })
  y += 5

  // First day of month offset
  const firstDow = new Date(data.year, data.month - 1, 1).getDay()
  let col = firstDow

  for (let day = 1; day <= daysInMonth; day++) {
    const row     = Math.floor(col / 7)
    const colInRow= col % 7
    const x       = calStartX + colInRow * cellW
    const cy      = y + row * cellH
    const present = !!data.attendance[String(day)]
    const isWknd  = colInRow === 0 || colInRow === 6

    // Cell background
    if (present) {
      doc.setFillColor(...GREEN_LIGHT)
    } else if (isWknd) {
      doc.setFillColor(...AMBER_LIGHT)
    } else {
      doc.setFillColor(250, 250, 250)
    }
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.2)
    doc.rect(x, cy, cellW, cellH, 'FD')

    // Day number
    doc.setFontSize(6)
    doc.setFont('helvetica', present ? 'bold' : 'normal')
    doc.setTextColor(
      present ? GREEN_DARK[0] : isWknd ? AMBER_DARK[0] : GRAY_MID[0],
      present ? GREEN_DARK[1] : isWknd ? AMBER_DARK[1] : GRAY_MID[1],
      present ? GREEN_DARK[2] : isWknd ? AMBER_DARK[2] : GRAY_MID[2],
    )
    doc.text(String(day), x + cellW / 2, cy + 3.2, { align: 'center' })

    // Tick mark for present days
    if (present) {
      doc.setFontSize(5)
      doc.text('✓', x + cellW / 2, cy + 4.2, { align: 'center' })
    }

    col++
  }

  // How many rows the calendar took
  const calRows = Math.ceil((firstDow + daysInMonth) / 7)
  y += calRows * cellH + 5

  // ── Pay breakdown table ───────────────────────────────
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('PAY BREAKDOWN', 10, y)
  y += 3

  const payRows: (string | number)[][] = [
    ['Days worked',                 `${data.daysWorked} days`],
    ['Rate per day',                `${symbol} ${data.dayRate}`],
    ['Gross pay',                   formatMoney(data.grossPay, currency)],
  ]

  if (data.deduction > 0) {
    payRows.push(['Deduction (advance/loan)', `− ${formatMoney(data.deduction, currency)}`])
  }

  payRows.push(['Net normal pay',  formatMoney(data.netPay, currency)])

  if (data.otPay > 0) {
    payRows.push(
      ['OT hours worked', `${data.otHours} hrs @ ${symbol} ${data.otRate}/hr`],
      ['Overtime pay',    formatMoney(data.otPay, currency)],
    )
  }

  const totalTakeHome = data.netPay + data.otPay

  payRows.push([
    'TOTAL TAKE-HOME PAY',
    formatMoney(totalTakeHome, currency),
  ])

  autoTable(doc, {
    body: payRows,
    startY: y,
    margin: { left: 8, right: 8 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: {
        halign: 'left',
        textColor: GRAY_MID,
        cellWidth: (pageW - 16) * 0.62,
      },
      1: {
        halign: 'right',
        fontStyle: 'bold',
        textColor: BLACK,
      },
    },
    didParseCell: (hook) => {
      const label = String(hook.cell.raw)

      // Gross pay row
      if (label.startsWith('Gross')) {
        hook.cell.styles.textColor  = GRAY_MID
        hook.cell.styles.fontStyle  = 'normal'
      }

      // Deduction row — red
      if (label.startsWith('Deduction')) {
        hook.cell.styles.fillColor  = RED_LIGHT
        hook.cell.styles.textColor  = RED_DARK
        hook.cell.styles.fontStyle  = 'bold'
      }

      // OT rows — amber
      if (label.startsWith('OT') || label.startsWith('Overtime')) {
        hook.cell.styles.fillColor  = AMBER_LIGHT
        hook.cell.styles.textColor  = AMBER_DARK
      }

      // Total row — green and bold
      if (hook.row.index === payRows.length - 1) {
        hook.cell.styles.fillColor  = GREEN_LIGHT
        hook.cell.styles.textColor  = GREEN_DARK
        hook.cell.styles.fontStyle  = 'bold'
        hook.cell.styles.fontSize   = 9
      }
    },
  })

  const afterTable = (doc as any).lastAutoTable.finalY + 6

  // ── Signature section ─────────────────────────────────
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('EMPLOYEE SIGNATURE', 10, afterTable)
  doc.text('AUTHORISED BY', pageW / 2 + 4, afterTable)

  doc.setDrawColor(...GRAY_MID)
  doc.setLineWidth(0.3)
  // Employee signature line
  doc.line(10, afterTable + 12, pageW / 2 - 4, afterTable + 12)
  // Authorised by line
  doc.line(pageW / 2 + 4, afterTable + 12, pageW - 10, afterTable + 12)

  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_MID)
  doc.text(data.workerName, 10, afterTable + 15)
  doc.text(data.preparedBy, pageW / 2 + 4, afterTable + 15)

  // Date line
  doc.text('Date: ___________________', 10, afterTable + 22)

  // ── Save ──────────────────────────────────────────────
  doc.save(
    `Payslip — ${data.workerName} — ${monthName} ${data.year}.pdf`
  )
}