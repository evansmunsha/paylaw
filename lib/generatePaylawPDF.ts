import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencySymbol, formatMoney } from './currency'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

interface PaylawRow {
  employeeId: string
  name: string
  jobTitle: string
  dayRate: number
  daysWorked: number
  amount: number
  attendance: Record<string, boolean>
  signature: string
}

interface CompanySettings {
  companyName: string
  phone: string
  email: string
  address: string
}

interface PaylawData {
  site: string
  month: number
  year: number
  preparedBy: string
  foodExpense: number
  otherDeduct: number
  rows: PaylawRow[]
  company?: CompanySettings
}

export function generatePaylawPDF(data: PaylawData, currency: string = 'ZMW') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
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
  const AMBER_DARK  = [146, 64,  14]  as [number,number,number]
  const AMBER_LIGHT = [255,251,235]   as [number,number,number]
  const GRAY_LIGHT  = [243,244,246]   as [number,number,number]
  const GRAY_MID    = [107,114,128]   as [number,number,number]
  const WHITE       = [255,255,255]   as [number,number,number]
  const BORDER      = [209,213,219]   as [number,number,number]

  let y = 12

  // ── Company name ──────────────────────────────────────
  if (company?.companyName) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(company.companyName, pageW / 2, y, { align: 'center' })
    y += 6
  }

  // ── PAYLAW title ──────────────────────────────────────
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('PAYLAW', pageW / 2, y, { align: 'center' })
  y += 6

  // ── Contact line ──────────────────────────────────────
  if (company) {
    const parts = [company.phone, company.email, company.address].filter(Boolean)
    if (parts.length > 0) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...GRAY_MID)
      doc.text(parts.join('  |  '), pageW / 2, y, { align: 'center' })
      y += 5
    }
  }

  // ── Site + Period ─────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  doc.text(
    `Site: ${data.site}  \u00B7  Period: ${monthName} ${data.year}`,
    pageW / 2, y, { align: 'center' }
  )
  y += 4

  // ── Divider line ──────────────────────────────────────
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.6)
  doc.line(10, y, pageW - 10, y)
  y += 4

  // ── Build table data ──────────────────────────────────
  // Use plain ASCII "v" instead of unicode checkmark to avoid encoding issues
  const PRESENT_MARK = 'v'

  const head = [[
    'Name', 'Job Title', `${symbol}/day`,
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d   = i + 1
      const dow = new Date(data.year, data.month - 1, d).getDay()
      return `${d}\n${DAY_LABELS[dow]}`
    }),
    'Days', `Amount (${symbol})`, 'Signature',
  ]]

  const body: (string | number)[][] = data.rows.map(row => [
    row.name,
    row.jobTitle,
    row.dayRate,
    ...Array.from({ length: daysInMonth }, (_, i) =>
      row.attendance[String(i + 1)] ? PRESENT_MARK : ''
    ),
    row.daysWorked,
    formatMoney(row.amount, currency).split(' ').slice(1).join(' '),
    row.signature || '',
  ])

  const totalAmount = data.rows.reduce((t, r) => t + r.amount, 0)
  const totalDays   = data.rows.reduce((t, r) => t + r.daysWorked, 0)

  // Daily totals row
  body.push([
    'Daily total', '', '',
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const c = data.rows.filter(r => !!r.attendance[String(i + 1)]).length
      return c > 0 ? c : ''
    }),
    totalDays,
    formatMoney(totalAmount, currency).split(' ').slice(1).join(' '),
    '',
  ])

  // ── Calculate dynamic day column width ────────────────
  // Total available width minus fixed columns
  const fixedColsWidth = 26 + 20 + 12 + 10 + 18 + 18  // name+title+rate+days+amount+sig
  const margins = 20
  const availableForDays = pageW - margins - fixedColsWidth
  const dayColW = Math.max(4.5, availableForDays / daysInMonth)

  // ── Draw attendance table ─────────────────────────────
  autoTable(doc, {
    head,
    body,
    startY: y,
    theme: 'grid',
    styles: {
      fontSize: 6.5,
      cellPadding: 1,
      halign: 'center',
      valign: 'middle',
      lineColor: BORDER,
      lineWidth: 0.2,
      textColor: BLACK,
      overflow: 'hidden',
    },
    headStyles: {
      fillColor: BLACK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 6,
      lineColor: [55, 65, 81],
      minCellHeight: 8,
    },
    columnStyles: {
      // Name
      0: { halign: 'left', cellWidth: 26, fontStyle: 'bold' },
      // Job title
      1: { halign: 'left', cellWidth: 20, textColor: GRAY_MID },
      // {symbol}/day
      2: { cellWidth: 12, textColor: GREEN_DARK, fontStyle: 'bold' },
      // Days column
      [3 + daysInMonth]: {
        cellWidth: 10, fontStyle: 'bold', textColor: BLACK,
      },
      // Amount column
      [4 + daysInMonth]: {
        cellWidth: 18, fontStyle: 'bold', textColor: GREEN_DARK,
      },
      // Signature
      [5 + daysInMonth]: {
        cellWidth: 18, textColor: GRAY_MID,
      },
      // Apply dynamic width to all day columns
      ...Object.fromEntries(
        Array.from({ length: daysInMonth }, (_, i) => [
          i + 3,
          { cellWidth: dayColW }
        ])
      ),
    },
    didParseCell: (hook) => {
      const isLastRow = hook.row.index === body.length - 1

      // Total row styling
      if (isLastRow) {
        hook.cell.styles.fillColor  = GRAY_LIGHT
        hook.cell.styles.fontStyle  = 'bold'
        hook.cell.styles.textColor  = BLACK
        if (hook.column.index === 4 + daysInMonth) {
          hook.cell.styles.textColor = GREEN_DARK
        }
      }

      // Present cell — green tint
      if (
        !isLastRow &&
        hook.section === 'body' &&
        hook.column.index >= 3 &&
        hook.column.index < 3 + daysInMonth &&
        hook.cell.raw === PRESENT_MARK
      ) {
        hook.cell.styles.fillColor  = GREEN_LIGHT
        hook.cell.styles.textColor  = GREEN_DARK
        hook.cell.styles.fontStyle  = 'bold'
      }

      // Weekend columns — amber tint
      if (
        hook.section === 'body' &&
        hook.column.index >= 3 &&
        hook.column.index < 3 + daysInMonth
      ) {
        const dayNum = hook.column.index - 3 + 1
        const dow    = new Date(data.year, data.month - 1, dayNum).getDay()
        if ((dow === 0 || dow === 6) && hook.cell.raw !== PRESENT_MARK) {
          hook.cell.styles.fillColor = AMBER_LIGHT
        }
      }

      // Weekend header — amber
      if (hook.section === 'head') {
        const idx = hook.column.index
        if (idx >= 3 && idx < 3 + daysInMonth) {
          const dayNum = idx - 3 + 1
          const dow    = new Date(data.year, data.month - 1, dayNum).getDay()
          if (dow === 0 || dow === 6) {
            hook.cell.styles.fillColor = AMBER_DARK
          }
        }
      }

      // Alternating row background
      if (
        hook.section === 'body' &&
        !isLastRow &&
        hook.row.index % 2 !== 0 &&
        !hook.cell.styles.fillColor
      ) {
        hook.cell.styles.fillColor = [249, 250, 251]
      }
    },
  })

  // ── Description + Prepared By ─────────────────────────
  const afterTable = (doc as any).lastAutoTable.finalY + 6
  const colW       = (pageW - 20) / 2
  const leftX      = 10
  const rightX     = 10 + colW + 4

  // Description title
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('DESCRIPTION', leftX, afterTable)

  const descRows = [
    ['Absents',           '0'],
    ['Salaries',          formatMoney(totalAmount, currency)],
    ['Overtime',          'See OT sheet'],
    ['Food Expense',      formatMoney(data.foodExpense, currency)],
    ['Other Deductions',  formatMoney(data.otherDeduct, currency)],
    ['Total Amount Spent',
     formatMoney(totalAmount + data.foodExpense + data.otherDeduct, currency)],
  ]

  autoTable(doc, {
    body: descRows,
    startY: afterTable + 3,
    margin: { left: leftX, right: pageW - (leftX + colW) },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: BORDER,
      lineWidth: 0.2,
      overflow: 'hidden',
    },
    columnStyles: {
      0: { halign: 'left', textColor: GRAY_MID, cellWidth: colW * 0.55 },
      1: { halign: 'left', fontStyle: 'bold', textColor: BLACK, cellWidth: colW * 0.45 },
    },
    didParseCell: (hook) => {
      if (hook.row.index === descRows.length - 1) {
        hook.cell.styles.fillColor = GRAY_LIGHT
        hook.cell.styles.fontStyle = 'bold'
        if (hook.column.index === 1) {
          hook.cell.styles.textColor = GREEN_DARK
        }
      }
    },
  })

  // Prepared by title
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('PREPARED BY', rightX, afterTable)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...BLACK)
  doc.text(data.preparedBy, rightX, afterTable + 8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MID)
  doc.text('Signature:', rightX, afterTable + 18)
  doc.setDrawColor(...GRAY_MID)
  doc.setLineWidth(0.3)
  doc.line(rightX, afterTable + 26, rightX + 60, afterTable + 26)

  doc.text('Date:', rightX, afterTable + 34)
  doc.line(rightX, afterTable + 42, rightX + 45, afterTable + 42)

  // ── Save ──────────────────────────────────────────────
  doc.save(`Paylaw \u2014 ${data.site} \u2014 ${monthName} ${data.year}.pdf`)
}