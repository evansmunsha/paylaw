// ─────────────────────────────────────────────────────────────────────────────
// generateOvertimePDF.ts
// Generates a downloadable PDF for an Overtime Sheet record using jsPDF + autoTable.
// The goal is to match the look of the HTML print page exactly:
//   - Amber-brown header row, deep amber Sa/Su columns, amber OT hour cells
//   - Alternating row stripes, grey totals row
//   - Summary table on the left, Prepared By on the right
// ─────────────────────────────────────────────────────────────────────────────

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCurrencySymbol, formatMoney } from './currency'

// ── Static lookup arrays ──────────────────────────────────────────────────────

// Converts month number (1–12) into a readable name for the title and filename
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

// Short day labels indexed by getDay() result (0 = Sun … 6 = Sat)
// Printed under each day number in the table header
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── TypeScript interfaces ─────────────────────────────────────────────────────

// One row in the overtime table — one per employee
interface OvertimeRow {
  employeeId: string
  name: string
  jobTitle: string
  otRate: number           // hourly OT rate in Kwacha
  totalHours: number       // total OT hours for the month
  amount: number           // totalHours × otRate
  hours: Record<string, number> // e.g. { "3": 2, "7": 3 } — day: hours worked
  signature: string
}

// Optional company branding shown in the document header
interface CompanySettings {
  companyName: string
  phone: string
  email: string
  address: string
}

// The full data object passed into the generator
interface OvertimeData {
  site: string
  month: number  // 1–12
  year: number
  preparedBy: string
  rows: OvertimeRow[]
  company?: CompanySettings
}

// ── Main export function ──────────────────────────────────────────────────────
export function generateOvertimePDF(data: OvertimeData, currency: string = 'ZMW') {
  const symbol = getCurrencySymbol(currency)

  // Create an A4 landscape document — landscape fits all 31 day columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Page width in mm (297mm for A4 landscape)
  const pageW       = doc.internal.pageSize.getWidth()
  const monthName   = MONTH_NAMES[data.month - 1]
  // Total days in the given month — determines how many day columns to draw
  const daysInMonth = new Date(data.year, data.month, 0).getDate()
  const company     = data.company

  // ── Colour palette (RGB tuples for jsPDF) ────────────────────────────────
  // Matches the HTML print page colours exactly — all amber theme for overtime

  const BLACK      = [17,  24,  39]  as [number,number,number] // body text
  const AMBER_DARK = [120, 53,  15]  as [number,number,number] // header bg (#78350f)
  const AMBER_MID  = [146, 64,  14]  as [number,number,number] // OT text, rate text (#92400e)
  const AMBER_LIGHT= [255, 251, 235] as [number,number,number] // OT cell bg, weekend cell bg (#fffbeb)
  const AMBER_DEEP = [69,  26,   3]  as [number,number,number] // weekend header bg (#451a03)
  const GRAY_LIGHT = [243, 244, 246] as [number,number,number] // totals row bg, summary total bg
  const GRAY_MID   = [107, 114, 128] as [number,number,number] // job title text, labels
  const WHITE      = [255, 255, 255] as [number,number,number] // header text
  const BORDER     = [209, 213, 219] as [number,number,number] // cell border colour
  const STRIPE     = [249, 250, 251] as [number,number,number] // odd row stripe bg

  // y tracks the current vertical drawing position in mm
  let y = 12

  // ── DOCUMENT HEADER ───────────────────────────────────────────────────────

  // Company name — only drawn if provided in settings
  if (company?.companyName) {
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(company.companyName, pageW / 2, y, { align: 'center' })
    y += 6
  }

  // Main document title — large bold centred text
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('OVERTIME SHEET', pageW / 2, y, { align: 'center' })
  y += 6

  // Contact line — phone | email | address, only drawn if at least one exists
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

  // Site and period line — e.g. "Site: Ioiu · Period: May 2026"
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  doc.text(
    `Site: ${data.site}  \u00B7  Period: ${monthName} ${data.year}`,
    pageW / 2, y, { align: 'center' }
  )
  y += 5

  // Thick horizontal divider line below the header — matches the HTML border-bottom
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.6)
  doc.line(10, y, pageW - 10, y)
  y += 10 // minimal gap — table starts immediately after the divider line

  // ── BUILD TABLE DATA ──────────────────────────────────────────────────────

  // Header row — static columns + one column per day in the month
  const head = [[
    'Name', 'Job Title', `${symbol}/hr`,
    // Day columns: number on top, abbreviated day name below (e.g. "1\nFr")
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d   = i + 1
      const dow = new Date(data.year, data.month - 1, d).getDay()
      return `${d}\n${DAY_LABELS[dow]}`
    }),
    'Total Hrs', `Amount (${symbol})`, 'Signature',
  ]]

  // Body rows — one per employee
  const body: (string | number)[][] = data.rows.map(row => [
    row.name,
    row.jobTitle,
    row.otRate,
    // Day cells: show hours if > 0, empty string if none worked that day
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const h = row.hours[String(i + 1)] || 0
      return h > 0 ? h : ''
    }),
    `${row.totalHours}h`,         // total hours with "h" suffix
    formatMoney(row.amount, currency).split(' ').slice(1).join(' '),  // formatted amount
    row.signature || '',
  ])

  // Grand totals — summed across all employee rows
  const grandHours  = data.rows.reduce((t, r) => t + r.totalHours, 0)
  const grandAmount = data.rows.reduce((t, r) => t + r.amount, 0)

  // Daily total row — appended as the last body row
  // Shows the sum of OT hours all employees logged on each specific day
  body.push([
    'Daily total', '', '',
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const t = data.rows.reduce((s, r) => s + (r.hours[String(i + 1)] || 0), 0)
      return t > 0 ? `${t}h` : '' // show blank instead of "0h" for cleaner look
    }),
    `${grandHours}h`,
    formatMoney(grandAmount, currency).split(' ').slice(1).join(' '),
    '',
  ])

  // ── DYNAMIC DAY COLUMN WIDTH ──────────────────────────────────────────────
  // Fixed columns have known widths — the remaining space is shared equally
  // among the 28–31 day columns so they fill the page without overflow
  const fixedColsWidth = 26 + 20 + 12 + 14 + 18 + 18 // name+title+rate+hrs+amount+sig
  const margins        = 20                            // 10mm left + 10mm right
  const availableForDays = pageW - margins - fixedColsWidth
  // Minimum 4.5mm per day column — prevents columns from becoming unreadable
  const dayColW = Math.max(4.5, availableForDays / daysInMonth)

  // ── DRAW HOURS TABLE ──────────────────────────────────────────────────────
  autoTable(doc, {
    head,
    body,
    startY: y,
    theme: 'grid', // draws borders around every cell

    // Default styles applied to all cells
    styles: {
      fontSize: 6.5,
      cellPadding: 1,
      halign: 'center',
      valign: 'middle',
      lineColor: BORDER,
      lineWidth: 0.2,
      textColor: BLACK,
      overflow: 'hidden', // clip text that is too wide for the cell
    },

    // Header row styles — amber-brown background, white bold text
    headStyles: {
      fillColor: AMBER_DARK,        // amber-900 — matches .att-table th for overtime
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 6,
      lineColor: [92, 40, 5],
      minCellHeight: 8,             // tall enough for day number + day label on two lines
    },

    // Per-column width and style overrides
    columnStyles: {
      0: { halign: 'left', cellWidth: 26, fontStyle: 'bold' },          // Name — left-aligned, bold
      1: { halign: 'left', cellWidth: 20, textColor: GRAY_MID },        // Job Title — muted grey
      2: { cellWidth: 12,  textColor: AMBER_MID, fontStyle: 'bold' },   // K/hr — amber bold
      [3 + daysInMonth]: { cellWidth: 14, fontStyle: 'bold', textColor: AMBER_MID }, // Total Hrs
      [4 + daysInMonth]: { cellWidth: 18, fontStyle: 'bold', textColor: AMBER_MID }, // Amount
      [5 + daysInMonth]: { cellWidth: 18, textColor: GRAY_MID },        // Signature

      // Day columns — spread evenly using the calculated dayColW
      ...Object.fromEntries(
        Array.from({ length: daysInMonth }, (_, i) => [i + 3, { cellWidth: dayColW }])
      ),
    },

    // didParseCell fires for every cell — lets us override styles per-cell
    didParseCell: (hook) => {
      const isLastRow = hook.row.index === body.length - 1 // true for the "Daily total" row

      // ── DAILY TOTAL ROW ───────────────────────────────────────────────────
      // Grey background + amber bold text to separate it from employee rows
      if (isLastRow) {
        hook.cell.styles.fillColor = GRAY_LIGHT
        hook.cell.styles.fontStyle = 'bold'
        hook.cell.styles.textColor = AMBER_MID // amber text in total row
      }

      // ── CELLS WITH OT HOURS (employee worked overtime that day) ───────────
      // Amber bg + amber bold text — only for day columns, not the total row
      if (
        !isLastRow &&
        hook.section === 'body' &&
        hook.column.index >= 3 &&
        hook.column.index < 3 + daysInMonth &&
        hook.cell.raw !== '' &&
        hook.cell.raw !== 0
      ) {
        hook.cell.styles.fillColor = AMBER_LIGHT // same shade as weekend bg
        hook.cell.styles.textColor = AMBER_MID
        hook.cell.styles.fontStyle = 'bold'
      }

      // ── WEEKEND BODY CELLS (Sa / Su columns) ─────────────────────────────
      // Amber tint on empty weekend cells (no OT hours logged).
      // Cells with hours keep their amber from the block above — same colour
      // anyway, but the text colour and bold are already set there.
      if (
        hook.section === 'body' &&
        hook.column.index >= 3 &&
        hook.column.index < 3 + daysInMonth
      ) {
        const dayNum = hook.column.index - 3 + 1
        const dow    = new Date(data.year, data.month - 1, dayNum).getDay()
        // Only apply to empty cells — cells with hours are already styled above
        if ((dow === 0 || dow === 6) && (hook.cell.raw === '' || hook.cell.raw === 0)) {
          hook.cell.styles.fillColor = AMBER_LIGHT
        }
      }

      // ── WEEKEND HEADER CELLS ──────────────────────────────────────────────
      // Deep amber (#451a03) for Sa/Su header columns — darker than the base
      // amber-900 header to make weekends stand out, matching .att-table th.th-weekend
      if (hook.section === 'head') {
        const idx = hook.column.index
        if (idx >= 3 && idx < 3 + daysInMonth) {
          const dayNum = idx - 3 + 1
          const dow    = new Date(data.year, data.month - 1, dayNum).getDay()
          if (dow === 0 || dow === 6) {
            hook.cell.styles.fillColor = AMBER_DEEP // deepest amber for weekend headers
          }
        }
      }

      // ── ALTERNATING ROW STRIPES ───────────────────────────────────────────
      // Odd rows get a very light grey so rows are easier to scan horizontally.
      // Only applied when no other fill colour has been set (OT / weekend / total take priority)
      if (
        hook.section === 'body' &&
        !isLastRow &&
        hook.row.index % 2 !== 0 &&
        !hook.cell.styles.fillColor
      ) {
        hook.cell.styles.fillColor = STRIPE
      }
    },
  })

  // ── BOTTOM SECTION: Summary + Prepared By ────────────────────────────────
  // finalY is the Y position right after the hours table ends
  const afterTable = (doc as any).lastAutoTable.finalY + 6
  // Split the remaining width into two equal columns
  const colW  = (pageW - 20) / 2
  const leftX = 10              // left column starts at left margin
  const rightX = 10 + colW + 4 // right column starts after left column + gap

  // ── SUMMARY TABLE (left side) ─────────────────────────────────────────────

  // Section title above the summary table
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('SUMMARY', leftX, afterTable)

  // Two-row summary: total hours and total payout
  autoTable(doc, {
    body: [
      ['Total OT Hours',  `${grandHours} hrs`],
      // Total payout is the last row — styled with grey bg and amber text below
      ['Total OT Payout', formatMoney(grandAmount, currency)],
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
      0: { halign: 'left', textColor: GRAY_MID, cellWidth: colW * 0.55 }, // label column
      1: { halign: 'left', fontStyle: 'bold', textColor: BLACK, cellWidth: colW * 0.45 }, // value column
    },
    didParseCell: (hook) => {
      // Style the last row (Total OT Payout) with grey bg and amber amount text
      if (hook.row.index === 1) {
        hook.cell.styles.fillColor = GRAY_LIGHT
        hook.cell.styles.fontStyle = 'bold'
        if (hook.column.index === 1) {
          hook.cell.styles.textColor = AMBER_MID // amber payout amount
        }
      }
    },
  })

  // ── PREPARED BY BLOCK (right side) ───────────────────────────────────────

  // Section title
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('PREPARED BY', rightX, afterTable)

  // Name of the person who prepared this overtime sheet
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...BLACK)
  doc.text(data.preparedBy, rightX, afterTable + 8)

  // Signature label + underline for manual signing
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY_MID)
  doc.text('Signature:', rightX, afterTable + 18)
  doc.setDrawColor(...GRAY_MID)
  doc.setLineWidth(0.3)
  doc.line(rightX, afterTable + 26, rightX + 60, afterTable + 26) // signature line

  // Date label + underline
  doc.text('Date:', rightX, afterTable + 34)
  doc.line(rightX, afterTable + 42, rightX + 45, afterTable + 42) // date line

  // ── SAVE PDF ──────────────────────────────────────────────────────────────
  // \u2014 is the em dash character — used in the filename between segments
  doc.save(`Overtime \u2014 ${data.site} \u2014 ${monthName} ${data.year}.pdf`)
}