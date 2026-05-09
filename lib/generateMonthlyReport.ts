import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

interface WorkerRow {
  name: string
  jobTitle: string
  daysWorked: number
  grossPay: number
  deduction: number
  netPay: number
  otHours: number
  otPay: number
}

interface SiteData {
  site: string
  workers: WorkerRow[]
  foodExpense: number
  otherDeduct: number
}

interface CompanySettings {
  companyName: string
  phone: string
  email: string
  address: string
}

interface MonthlyReportData {
  month: number
  year: number
  preparedBy: string
  sites: SiteData[]
  company?: CompanySettings
}

export function generateMonthlyReport(data: MonthlyReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageW     = doc.internal.pageSize.getWidth()
  const pageH     = doc.internal.pageSize.getHeight()
  const monthName = MONTH_NAMES[data.month - 1]
  const company   = data.company

  // ── Colours ───────────────────────────────────────────
  const BLACK      = [17,  24,  39]  as [number,number,number]
  const GREEN_DARK = [21, 128,  61]  as [number,number,number]
  const GREEN_LIGHT= [240,253,244]   as [number,number,number]
  const AMBER_DARK = [146, 64,  14]  as [number,number,number]
  const AMBER_LIGHT= [255,251,235]   as [number,number,number]
  const RED_DARK   = [185, 28,  28]  as [number,number,number]
  const RED_LIGHT  = [254,242,242]   as [number,number,number]
  const GRAY_MID   = [107,114,128]   as [number,number,number]
  const GRAY_LIGHT = [243,244,246]   as [number,number,number]
  const WHITE      = [255,255,255]   as [number,number,number]
  const BORDER     = [209,213,219]   as [number,number,number]

  // ── Grand totals ──────────────────────────────────────
  const allWorkers  = data.sites.flatMap(s => s.workers)
  const grandNormal = allWorkers.reduce((t, w) => t + w.netPay, 0)
  const grandOT     = allWorkers.reduce((t, w) => t + w.otPay, 0)
  const grandDeduct = allWorkers.reduce((t, w) => t + w.deduction, 0)
  const grandFood   = data.sites.reduce(
    (t, s) => t + s.foodExpense + s.otherDeduct, 0
  )
  const grandTotal  = grandNormal + grandOT + grandFood

  // ═══════════════════════════════════════════════════════
  // PAGE 1 — Cover / Summary
  // ═══════════════════════════════════════════════════════

  let y = 20

  // Company name
  if (company?.companyName) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(company.companyName, pageW / 2, y, { align: 'center' })
    y += 8
  }

  // Report title
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('MONTHLY PAYROLL REPORT', pageW / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY_MID)
  doc.text(`${monthName} ${data.year}`, pageW / 2, y, { align: 'center' })
  y += 5

  if (company) {
    const parts = [
      company.phone, company.email, company.address,
    ].filter(Boolean)
    if (parts.length > 0) {
      doc.setFontSize(8)
      doc.text(parts.join('  |  '), pageW / 2, y, { align: 'center' })
      y += 4
    }
  }

  // Divider
  doc.setDrawColor(...BLACK)
  doc.setLineWidth(0.8)
  doc.line(15, y, pageW - 15, y)
  y += 8

  // ── Summary boxes ─────────────────────────────────────
  const boxW = (pageW - 30) / 4
  const boxH = 22
  const boxes = [
    {
      label: 'NORMAL PAY',
      value: `K ${grandNormal.toLocaleString()}`,
      sub: `${allWorkers.length} workers`,
      color: GREEN_DARK,
      bg: GREEN_LIGHT,
    },
    {
      label: 'OVERTIME PAY',
      value: `K ${grandOT.toLocaleString()}`,
      sub: `${allWorkers.filter(w => w.otHours > 0).length} workers`,
      color: AMBER_DARK,
      bg: AMBER_LIGHT,
    },
    {
      label: 'DEDUCTIONS',
      value: `K ${grandDeduct.toLocaleString()}`,
      sub: 'Loans & advances',
      color: RED_DARK,
      bg: RED_LIGHT,
    },
    {
      label: 'TOTAL SPENT',
      value: `K ${grandTotal.toLocaleString()}`,
      sub: 'All inclusive',
      color: BLACK,
      bg: GRAY_LIGHT,
    },
  ]

  boxes.forEach((box, i) => {
    const x = 15 + i * (boxW + 2)

    // Box background
    doc.setFillColor(...(box.bg as [number,number,number]))
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD')

    // Top accent line
    doc.setFillColor(...(box.color as [number,number,number]))
    doc.roundedRect(x, y, boxW, 1.5, 1, 1, 'F')

    // Label
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(box.color as [number,number,number]))
    doc.text(box.label, x + boxW / 2, y + 6, { align: 'center' })

    // Value
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(box.value, x + boxW / 2, y + 13, { align: 'center' })

    // Sub
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_MID)
    doc.text(box.sub, x + boxW / 2, y + 18, { align: 'center' })
  })

  y += boxH + 8

  // ── Sites overview table ──────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('SITES OVERVIEW', 15, y)
  y += 4

  const siteTableRows = data.sites.map(s => {
    const normal = s.workers.reduce((t, w) => t + w.netPay, 0)
    const ot     = s.workers.reduce((t, w) => t + w.otPay, 0)
    const food   = s.foodExpense + s.otherDeduct
    return [
      s.site,
      String(s.workers.length),
      `K ${normal.toLocaleString()}`,
      `K ${ot.toLocaleString()}`,
      `K ${food.toLocaleString()}`,
      `K ${(normal + ot + food).toLocaleString()}`,
    ]
  })

  autoTable(doc, {
    head: [['Site', 'Workers', 'Normal Pay', 'OT Pay',
            'Expenses', 'Total']],
    body: siteTableRows,
    startY: y,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BLACK,
      textColor: WHITE,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right', textColor: GREEN_DARK, fontStyle: 'bold' },
      3: { halign: 'right', textColor: AMBER_DARK, fontStyle: 'bold' },
      4: { halign: 'right', textColor: GRAY_MID },
      5: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── All workers summary table ─────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GRAY_MID)
  doc.text('ALL WORKERS — ' + monthName.toUpperCase() + ' ' + data.year, 15, y)
  y += 4

  const workerTableRows = allWorkers.map(w => [
    w.name,
    w.jobTitle,
    String(w.daysWorked),
    `K ${w.grossPay.toLocaleString()}`,
    w.deduction > 0 ? `− K ${w.deduction.toLocaleString()}` : '—',
    `K ${w.netPay.toLocaleString()}`,
    w.otHours > 0 ? `${w.otHours}h` : '—',
    w.otPay > 0 ? `K ${w.otPay.toLocaleString()}` : '—',
    `K ${(w.netPay + w.otPay).toLocaleString()}`,
  ])

  // Grand total row
  workerTableRows.push([
    'TOTAL', '',
    String(allWorkers.reduce((t, w) => t + w.daysWorked, 0)),
    `K ${allWorkers.reduce((t, w) => t + w.grossPay, 0).toLocaleString()}`,
    grandDeduct > 0 ? `− K ${grandDeduct.toLocaleString()}` : '—',
    `K ${grandNormal.toLocaleString()}`,
    `${allWorkers.reduce((t, w) => t + w.otHours, 0)}h`,
    `K ${grandOT.toLocaleString()}`,
    `K ${(grandNormal + grandOT).toLocaleString()}`,
  ])

  autoTable(doc, {
    head: [['Name', 'Job', 'Days', 'Gross', 'Deduct',
            'Net Pay', 'OT Hrs', 'OT Pay', 'Total']],
    body: workerTableRows,
    startY: y,
    margin: { left: 15, right: 15 },
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: BORDER,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BLACK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 },
      1: { halign: 'left', cellWidth: 20, textColor: GRAY_MID },
      2: { halign: 'center', cellWidth: 10 },
      3: { halign: 'right', cellWidth: 18, textColor: GRAY_MID },
      4: { halign: 'right', cellWidth: 18, textColor: RED_DARK },
      5: { halign: 'right', cellWidth: 18, textColor: GREEN_DARK,
           fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 12, textColor: AMBER_DARK },
      7: { halign: 'right', cellWidth: 18, textColor: AMBER_DARK,
           fontStyle: 'bold' },
      8: { halign: 'right', cellWidth: 20, fontStyle: 'bold',
           textColor: BLACK },
    },
    didParseCell: (hook) => {
      // Total row
      if (hook.row.index === workerTableRows.length - 1) {
        hook.cell.styles.fillColor  = GRAY_LIGHT
        hook.cell.styles.fontStyle  = 'bold'
      }
    },
  })

  // ═══════════════════════════════════════════════════════
  // PAGE 2+ — One page per site with detailed breakdown
  // ═══════════════════════════════════════════════════════

  for (const site of data.sites) {
    doc.addPage()
    y = 15

    const siteNormal = site.workers.reduce((t, w) => t + w.netPay, 0)
    const siteOT     = site.workers.reduce((t, w) => t + w.otPay, 0)
    const siteTotal  = siteNormal + siteOT +
                       site.foodExpense + site.otherDeduct

    // Site header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BLACK)
    doc.text(site.site, pageW / 2, y, { align: 'center' })
    y += 6

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY_MID)
    doc.text(`${monthName} ${data.year}  ·  ${site.workers.length} workers`,
      pageW / 2, y, { align: 'center' })
    y += 4

    doc.setDrawColor(...BLACK)
    doc.setLineWidth(0.5)
    doc.line(15, y, pageW - 15, y)
    y += 6

    // Site mini summary boxes
    const sMiniBoxes = [
      { label: 'Normal Pay', value: `K ${siteNormal.toLocaleString()}`,
        color: GREEN_DARK },
      { label: 'Overtime',   value: `K ${siteOT.toLocaleString()}`,
        color: AMBER_DARK },
      { label: 'Expenses',
        value: `K ${(site.foodExpense + site.otherDeduct).toLocaleString()}`,
        color: GRAY_MID },
      { label: 'TOTAL',      value: `K ${siteTotal.toLocaleString()}`,
        color: BLACK },
    ]

    const mBoxW = (pageW - 30) / 4
    sMiniBoxes.forEach((b, i) => {
      const x = 15 + i * (mBoxW + 2)
      doc.setFillColor(...GRAY_LIGHT)
      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.roundedRect(x, y, mBoxW, 14, 1.5, 1.5, 'FD')

      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(b.color as [number,number,number]))
      doc.text(b.label, x + mBoxW / 2, y + 5, { align: 'center' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...BLACK)
      doc.text(b.value, x + mBoxW / 2, y + 11, { align: 'center' })
    })

    y += 20

    // Site workers detail table
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY_MID)
    doc.text('WORKER BREAKDOWN', 15, y)
    y += 4

    const siteRows = site.workers.map(w => [
      w.name,
      w.jobTitle,
      String(w.daysWorked),
      `K ${w.grossPay.toLocaleString()}`,
      w.deduction > 0 ? `− K ${w.deduction.toLocaleString()}` : '—',
      `K ${w.netPay.toLocaleString()}`,
      w.otHours > 0 ? `${w.otHours}h` : '—',
      w.otPay > 0 ? `K ${w.otPay.toLocaleString()}` : '—',
      `K ${(w.netPay + w.otPay).toLocaleString()}`,
    ])

    siteRows.push([
      'TOTAL', '',
      String(site.workers.reduce((t, w) => t + w.daysWorked, 0)),
      `K ${site.workers.reduce((t, w) => t + w.grossPay, 0).toLocaleString()}`,
      site.workers.reduce((t, w) => t + w.deduction, 0) > 0
        ? `− K ${site.workers.reduce((t, w) => t + w.deduction, 0).toLocaleString()}`
        : '—',
      `K ${siteNormal.toLocaleString()}`,
      `${site.workers.reduce((t, w) => t + w.otHours, 0)}h`,
      `K ${siteOT.toLocaleString()}`,
      `K ${(siteNormal + siteOT).toLocaleString()}`,
    ])

    autoTable(doc, {
      head: [['Name', 'Job Title', 'Days', 'Gross', 'Deduct',
              'Net Pay', 'OT Hrs', 'OT Pay', 'Total']],
      body: siteRows,
      startY: y,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: BORDER,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: BLACK,
        textColor: WHITE,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'left', textColor: GRAY_MID },
        2: { halign: 'center' },
        3: { halign: 'right', textColor: GRAY_MID },
        4: { halign: 'right', textColor: RED_DARK },
        5: { halign: 'right', textColor: GREEN_DARK, fontStyle: 'bold' },
        6: { halign: 'center', textColor: AMBER_DARK },
        7: { halign: 'right', textColor: AMBER_DARK, fontStyle: 'bold' },
        8: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
      },
      didParseCell: (hook) => {
        if (hook.row.index === siteRows.length - 1) {
          hook.cell.styles.fillColor = GRAY_LIGHT
          hook.cell.styles.fontStyle = 'bold'
        }
      },
    })

    // Description section
    const descY = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY_MID)
    doc.text('DESCRIPTION', 15, descY)

    autoTable(doc, {
      body: [
        ['Salaries (net)',    `K ${siteNormal.toLocaleString()}`],
        ['Overtime pay',     `K ${siteOT.toLocaleString()}`],
        ['Food expense',     `K ${site.foodExpense.toLocaleString()}`],
        ['Other deductions', `K ${site.otherDeduct.toLocaleString()}`],
        ['TOTAL',            `K ${siteTotal.toLocaleString()}`],
      ],
      startY: descY + 4,
      margin: { left: 15, right: pageW / 2 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: BORDER,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { halign: 'left', textColor: GRAY_MID },
        1: { halign: 'right', fontStyle: 'bold', textColor: BLACK },
      },
      didParseCell: (hook) => {
        if (hook.row.index === 4) {
          hook.cell.styles.fillColor = GREEN_LIGHT
          hook.cell.styles.textColor = GREEN_DARK
          hook.cell.styles.fontStyle = 'bold'
        }
      },
    })

    // Prepared by
    const sigY = (doc as any).lastAutoTable.finalY + 8
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...GRAY_MID)
    doc.text('PREPARED BY', pageW / 2 + 4, descY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...BLACK)
    doc.text(data.preparedBy, pageW / 2 + 4, descY + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY_MID)
    doc.text('Signature:', pageW / 2 + 4, descY + 18)
    doc.setDrawColor(...GRAY_MID)
    doc.setLineWidth(0.3)
    doc.line(pageW / 2 + 4, descY + 26, pageW - 15, descY + 26)

    doc.text('Date:', pageW / 2 + 4, descY + 34)
    doc.line(pageW / 2 + 4, descY + 42, pageW / 2 + 50, descY + 42)
  }

  // ── Save ──────────────────────────────────────────────
  doc.save(
    `PayLaw Monthly Report — ${monthName} ${data.year}.pdf`
  )
}