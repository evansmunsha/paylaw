import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

interface OvertimeRow {
  employeeId: string
  name: string
  jobTitle: string
  otRate: number
  totalHours: number
  amount: number
  hours: Record<string, number>
  signature: string
}

interface CompanySettings {
  companyName: string
  phone: string
  email: string
  address: string
}

interface OvertimeData {
  site: string
  month: number
  year: number
  preparedBy: string
  rows: OvertimeRow[]
  company?: CompanySettings
}

export function generateOvertimePDF(data: OvertimeData) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageW       = doc.internal.pageSize.getWidth()
  const monthName   = MONTH_NAMES[data.month - 1]
  const daysInMonth = new Date(data.year, data.month, 0).getDate()
  const company     = data.company

  // ── Colours ───────────────────────────────────────────
  const BLACK       = [17,  24,  39]  as [number,number,number]
  const AMBER_DARK  = [120, 53,  15]  as [number,number,number]
  const AMBER_MID   = [146, 64,  14]  as [number,number,number]
  const AMBER_LIGHT = [255, 251, 235] as [number,number,number]
  const AMBER_DEEP  = [69,  26,   3]  as [number,number,number]
  const GRAY_LIGHT  = [243, 244, 246] as [number,number,number]
  const GRAY_MID    = [107, 114, 128] as [number,number,number]
  const WHITE       = [255, 255, 255] as [number,number,number]
  const BORDER      = [209, 213, 219] as [number,number,number]

  let y = 12

  // ── Company name ──────────────────────────────────────
  if (company?.companyName) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(company.companyName, pageW / 2, y, { align: 'center' })
    y += 6
  }

  // ── OVERTIME SHEET title ──────────────────────────────
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('OVERTIME SHEET', pageW / 2, y, { align: 'center' })
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

  // ── Divider ───────────────────────────────────────────
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.6)
  doc.line(10, y, pageW - 10, y)
  y += 4

  // ── Build table data ──────────────────────────────────
  const head = [[
    'Name', 'Job Title', 'K/hr',
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d   = i + 1
      const dow = new Date(data.year, data.month - 1, d).getDay()
      return `${d}\n${DAY_LABELS[dow]}`
    }),
    'Total Hrs', 'Amount (K)', 'Signature',
  ]]

  const body: (string | number)[][] = data.rows.map(row => [
    row.name,
    row.jobTitle,
    row.otRate,
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const h = row.hours[String(i + 1)] || 0
      return h > 0 ? h : ''
    }),
    `${row.totalHours}h`,
    row.amount.toLocaleString(),
    row.signature || '',
  ])

  const grandHours  = data.rows.reduce((t, r) => t + r.totalHours, 0)
  const grandAmount = data.rows.reduce((t, r) => t + r.amount, 0)

  // Daily totals row
  body.push([
    'Daily total', '', '',
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const t = data.rows.reduce((s, r) => s + (r.hours[String(i + 1)] || 0), 0)
      return t > 0 ? `${t}h` : ''
    }),
    `${grandHours}h`,
    grandAmount.toLocaleString(),
    '',
  ])

  // ── Calculate dynamic day column width ────────────────
  const fixedColsWidth = 26 + 20 + 12 + 14 + 18 + 18  // name+title+rate+hrs+amount+sig
  const margins = 20
  const availableForDays = pageW - margins - fixedColsWidth
  const dayColW = Math.max(4.5, availableForDays / daysInMonth)

  // ── Draw hours table ──────────────────────────────────
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
      fillColor: AMBER_DARK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 6,
      lineColor: [92, 40, 5],
      minCellHeight: 8,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 26, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 20, textColor: GRAY_MID },
      2: { cellWidth: 12, textColor: AMBER_MID, fontStyle: 'bold' },
      [3 + daysInMonth]: {
        cellWidth: 14, fontStyle: 'bold', textColor: AMBER_MID,
      },
      [4 + daysInMonth]: {
        cellWidth: 18, fontStyle: 'bold', textColor: AMBER_MID,
      },
      [5 + daysInMonth]: {
        cellWidth: 18, textColor: GRAY_MID,
      },
      // Dynamic width for day columns
      ...Object.fromEntries(
        Array.from({ length: daysInMonth }, (_, i) => [
          i + 3,
          { cellWidth: dayColW }
        ])
      ),
    },
    didParseCell: (hook) => {
      const isLastRow = hook.row.index === body.length - 1

      // Total row
      if (isLastRow) {
        hook.cell.styles.fillColor = GRAY_LIGHT
        hook.cell.styles.fontStyle = 'bold'
        hook.cell.styles.textColor = AMBER_MID
      }

      // Cells with hours — amber tint
      if (
        !isLastRow &&
        hook.section === 'body' &&
        hook.column.index >= 3 &&
        hook.column.index < 3 + daysInMonth &&
        hook.cell.raw !== '' &&
        hook.cell.raw !== 0
      ) {
        hook.cell.styles.fillColor = AMBER_LIGHT
        hook.cell.styles.textColor = AMBER_MID
        hook.cell.styles.fontStyle = 'bold'
      }

      // Weekend columns — amber tint on empty cells
      if (
        hook.section === 'body' &&
        hook.column.index >= 3 &&
        hook.column.index < 3 + daysInMonth
      ) {
        const dayNum = hook.column.index - 3 + 1
        const dow    = new Date(data.year, data.month - 1, dayNum).getDay()
        if (
          (dow === 0 || dow === 6) &&
          (hook.cell.raw === '' || hook.cell.raw === 0)
        ) {
          hook.cell.styles.fillColor = AMBER_LIGHT
        }
      }

      // Weekend headers — deep amber
      if (hook.section === 'head') {
        const idx = hook.column.index
        if (idx >= 3 && idx < 3 + daysInMonth) {
          const dayNum = idx - 3 + 1
          const dow    = new Date(data.year, data.month - 1, dayNum).getDay()
          if (dow === 0 || dow === 6) {
            hook.cell.styles.fillColor = AMBER_DEEP
          }
        }
      }

      // Alternating row bg
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

  // ── Summary + Prepared By ─────────────────────────────
  const afterTable = (doc as any).lastAutoTable.finalY + 6
  const colW       = (pageW - 20) / 2
  const leftX      = 10
  const rightX     = 10 + colW + 4

  // Summary title
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('SUMMARY', leftX, afterTable)

  autoTable(doc, {
    body: [
      ['Total OT Hours',  `${grandHours} hrs`],
      ['Total OT Payout', `K ${grandAmount.toLocaleString()}`],
    ],
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
      if (hook.row.index === 1) {
        hook.cell.styles.fillColor = GRAY_LIGHT
        hook.cell.styles.fontStyle = 'bold'
        if (hook.column.index === 1) {
          hook.cell.styles.textColor = AMBER_MID
        }
      }
    },
  })

  // Prepared by
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
  doc.save(`Overtime \u2014 ${data.site} \u2014 ${monthName} ${data.year}.pdf`)
}