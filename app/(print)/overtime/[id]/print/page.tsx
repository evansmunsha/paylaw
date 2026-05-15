// ─────────────────────────────────────────────────────────────────────────────
// PrintOvertimePage.tsx
// Server-side rendered print/PDF page for a single Overtime Sheet record.
// Accessed at: /overtime/[id]/print
// The browser's "Print / Save as PDF" button triggers window.print().
// ─────────────────────────────────────────────────────────────────────────────

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrencySymbol, formatMoney } from '@/lib/currency'
import type { Metadata } from 'next'
import PrintButton from './PrintButton'

// ── Static lookup arrays ──────────────────────────────────────────────────────

// Used to convert month number (1–12) to a readable name
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

// Used to render the short day label (Su, Mo, Tu…) under each date number
// Index matches JavaScript's getDay() which returns 0 = Sunday, 6 = Saturday
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Page metadata (sets the browser tab title & suggested PDF filename) ───────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const ot = await prisma.overtime.findFirst({ where: { id } })
  if (!ot) return { title: 'Overtime Print' }
  const month = MONTH_NAMES[ot.month - 1]
  // e.g. "Overtime — Lusaka — May 2026" — browser uses this as the PDF filename
  return {
    title: `Overtime — ${ot.site} — ${month} ${ot.year}`,
  }
}

// ── Main page component ───────────────────────────────────────────────────────
export default async function PrintOvertimePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Redirect to login if no session exists
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params

  // Fetch the overtime record (with its rows & employees) and company settings
  // in parallel for speed
  const [overtime, settings] = await Promise.all([
    prisma.overtime.findFirst({
      where: { id, userId: session.user.id },
      include: { rows: { include: { employee: true } } },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  // Show a 404 page if the record doesn't exist or belongs to another user
  if (!overtime) notFound()

  const currency = settings?.currency || 'ZMW'
  const currencySymbol = getCurrencySymbol(currency)

  // ── Derived date values ─────────────────────────────────────────────────────

  const monthName   = MONTH_NAMES[overtime.month - 1]
  // Get the total number of days in this month (e.g. 31 for May)
  const daysInMonth = new Date(overtime.year, overtime.month, 0).getDate()
  // Create an array [1, 2, 3, … daysInMonth] to loop over for table columns
  const allDays     = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Returns 0 (Sun) – 6 (Sat) for a given day number in the current month/year
  function getDayOfWeek(day: number) {
    return new Date(overtime!.year, overtime!.month - 1, day).getDay()
  }

  // Returns true if the given day falls on Saturday (6) or Sunday (0)
  function isWeekend(day: number) {
    const d = getDayOfWeek(day)
    return d === 0 || d === 6
  }

  // ── Totals calculated from all employee rows ────────────────────────────────

  // Grand total overtime hours across all employees
  const grandHours  = overtime.rows.reduce((t, r) => t + r.totalHours, 0)
  // Grand total overtime payout amount across all employees
  const grandAmount = overtime.rows.reduce((t, r) => t + r.amount, 0)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── All styles are inline so this page is fully self-contained ── */}
      <style>{`

        /* ── PRINT COLOR FIX ─────────────────────────────────────────────────
           By default browsers strip background colors when printing to save ink.
           These three properties (vendor + standard) force every element to
           print exactly as it looks on screen — backgrounds, colors and all. */
        * {
          -webkit-print-color-adjust: exact !important; /* Safari / Chrome */
          print-color-adjust: exact !important;         /* Firefox / standard */
          color-adjust: exact !important;               /* older fallback */
        }

        /* ── PAGE BASE ───────────────────────────────────────────────────────
           Remove browser default body margins so the document fills the page */
        body { margin: 0 !important; padding: 0 !important; background: #f9fafb; }

        /* ── TOP TOOLBAR ─────────────────────────────────────────────────────
           Sticky bar at the top with Back link, title, and Print button.
           Stays visible while scrolling but is hidden when printing. */
        .print-toolbar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          font-family: sans-serif;
        }
        /* Back link in the toolbar */
        .print-back { font-size: 13px; color: #6b7280; text-decoration: none; }
        .print-back:hover { color: #111; }
        /* Centre title in the toolbar */
        .print-mid  { font-size: 13px; font-weight: 500; color: #374151; }

        /* ── DOCUMENT WRAPPER ────────────────────────────────────────────────
           White card that contains everything that will be printed */
        .print-wrap {
          background: white;
          padding: 24px 32px;
          min-height: 100vh;
          font-family: 'Segoe UI', Arial, sans-serif;
        }

        /* ── DOCUMENT HEADER ─────────────────────────────────────────────────
           Centred block at the top: company name, OVERTIME SHEET title,
           contact info, and site/period line. */
        .doc-header {
          text-align: center;
          border-bottom: 2px solid #111; /* thick divider line below header */
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 3px; }
        .doc-title    { font-size: 20px; font-weight: 800; letter-spacing: 0.15em; color: #111; }
        .contact-line { font-size: 10px; color: #6b7280; margin-top: 4px; }
        .period-line  { font-size: 11px; color: #374151; margin-top: 6px; }

        /* ── HOURS TABLE WRAPPER ─────────────────────────────────────────────
           Allows horizontal scroll on screen if the table is wider than the
           viewport. On print this is disabled so the table scales to fit. */
        .att-table-wrap { overflow-x: auto; }

        /* Base table styles — collapsed borders, small font */
        .att-table { border-collapse: collapse; font-size: 10px; width: 100%; }

        /* ── TABLE HEADER CELLS (all columns) ───────────────────────────────
           Amber-brown background (overtime theme), white text */
        .att-table th {
          background: #78350f !important; /* amber-900 */
          color: white !important;
          padding: 3px 5px;
          font-weight: 600;
          text-align: center;
          border: 1px solid #92400e;
          white-space: nowrap; /* prevent day labels from wrapping awkwardly */
        }
        /* Left-align modifier used on Name and Job Title header cells */
        .att-table th.l { text-align: left; }

        /* ── TABLE BODY CELLS (all columns) ─────────────────────────────────
           Light border, centred text, small font */
        .att-table td {
          border: 1px solid #d1d5db;
          padding: 3px 5px;
          text-align: center;
          font-size: 10px;
          white-space: nowrap;
        }
        /* Left-align modifier used on Name and Job Title body cells */
        .att-table td.l { text-align: left; }

        /* ── WEEKEND HEADER CELLS (Sa / Su columns) ──────────────────────────
           Darker amber to distinguish weekends from the regular amber header.
           Uses the compound selector .att-table th.th-weekend to have higher
           CSS specificity than .att-table th above — otherwise the base amber
           would win and the deep amber would never show. */
        .att-table th.th-weekend {
          background: #451a03 !important; /* amber-950 — deepest amber */
          color: #fef3c7 !important;      /* amber-100 — cream text */
          border-color: #78350f !important;
        }

        /* ── WEEKEND BODY CELLS (Sa / Su columns) ────────────────────────────
           Light amber tint applied to every weekend column cell as a base.
           This class is always added to weekend cells.
           The .td-has class below overrides this when OT hours exist. */
        .td-weekend { background: #fffbeb !important; } /* amber-50 */

        /* ── CELLS WITH OT HOURS ─────────────────────────────────────────────
           Amber tint + amber text for any cell where the employee logged hours.
           Declared AFTER .td-weekend so it wins when both classes are present
           (e.g. an employee worked OT on a Saturday). */
        .td-has { background: #fffbeb !important; color: #92400e !important; font-weight: 700; }

        /* ── ALTERNATING ROW STRIPES ─────────────────────────────────────────
           Odd-indexed rows get a very light grey so rows are easier to read */
        .tr-odd { background: #f9fafb !important; }

        /* ── DAILY TOTAL ROW ─────────────────────────────────────────────────
           The last row shows the total hours logged on each day.
           Medium grey background to separate it from the employee rows above. */
        .tr-total { background: #f3f4f6 !important; font-weight: 700; }

        /* ── SECTION TITLES (SUMMARY, PREPARED BY) ───────────────────────────
           Small uppercase labels above the summary tables at the bottom */
        .section-title {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: #374151; margin-bottom: 6px; margin-top: 14px;
          font-family: 'Segoe UI', Arial, sans-serif;
        }

        /* ── BOTTOM TWO-COLUMN LAYOUT ────────────────────────────────────────
           Splits the bottom section into Summary (left) and
           Prepared By (right) side by side */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-top: 16px;
        }

        /* ── SUMMARY TABLE ───────────────────────────────────────────────────
           Two-row table showing total OT hours and total OT payout */
        .desc-table { width: 100%; border-collapse: collapse; }
        .desc-table td { border: 1px solid #e5e7eb; padding: 4px 8px; text-align: left; font-size: 10px; }

        /* Last row (Total OT Payout) gets a grey background to stand out */
        .desc-total { background: #f3f4f6 !important; font-weight: 700; }

        /* ── SIGNATURE LINES ─────────────────────────────────────────────────
           Simple bottom-border lines for manual signature and date */
        .sign-line  { display: block; border-bottom: 1px solid #9ca3af; width: 180px; margin-top: 20px; }
        .sign-label { font-size: 10px; color: #6b7280; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif; }

        /* ── PRINT-ONLY OVERRIDES ────────────────────────────────────────────
           These rules only apply when the browser is printing (or saving PDF).
           They shrink font sizes and padding so everything fits on one A4 page. */
        @media print {
          /* Hide the toolbar — it should not appear in the PDF */
          .print-toolbar { display: none !important; }
          body { background: white !important; }
          /* Remove screen padding so the content fills the paper edge-to-edge */
          .print-wrap { padding: 0; }
          /* Let the table overflow naturally — the @page size handles fitting */
          .att-table-wrap { overflow: visible !important; }
          /* Shrink the table font to 7px so all 31 day columns fit on A4 landscape */
          .att-table { font-size: 7px !important; width: 100% !important; }
          .att-table th, .att-table td { padding: 2px 3px !important; font-size: 7px !important; }
          /* Keep Name and Job Title columns wide enough to be readable */
          .att-table th.l, .att-table td.l { min-width: 60px !important; }
        }

        /* ── PAGE SIZE & MARGINS ─────────────────────────────────────────────
           Tells the browser to use A4 landscape with 8mm margins when printing */
        @page { size: A4 landscape; margin: 8mm; }

      `}</style>

      {/* ── TOP TOOLBAR (hidden on print) ──────────────────────────────────── */}
      <div className="print-toolbar">
        {/* Back link — returns to the overtime detail page */}
        <a href={`/overtime/${overtime.id}`} className="print-back">← Back</a>
        {/* Centre label showing which site and period this document covers */}
        <span className="print-mid">{overtime.site} — {monthName} {overtime.year}</span>
        {/* Button that calls window.print() — defined in PrintButton.tsx */}
        <PrintButton />
      </div>

      {/* ── PRINTABLE DOCUMENT ─────────────────────────────────────────────── */}
      <div className="print-wrap">

        {/* ── DOCUMENT HEADER ──────────────────────────────────────────────── */}
        <div className="doc-header">
          {/* Company name — only rendered if set in Settings */}
          {settings?.companyName && (
            <p className="company-name">{settings.companyName}</p>
          )}
          {/* Main document title */}
          <p className="doc-title">OVERTIME SHEET</p>
          {/* Contact line — only rendered if at least one field is set */}
          {(settings?.phone || settings?.email || settings?.address) && (
            <p className="contact-line">
              {[settings.phone, settings.email, settings.address]
                .filter(Boolean).join('  |  ')}
            </p>
          )}
          {/* Site name and month/year period */}
          <p className="period-line">
            Site: <strong>{overtime.site}</strong>
            &nbsp;·&nbsp;
            Period: <strong>{monthName} {overtime.year}</strong>
          </p>
        </div>

        {/* ── HOURS TABLE ──────────────────────────────────────────────────── */}
        <div className="att-table-wrap">
          {/* minWidth: max-content prevents columns from collapsing on screen */}
          <table className="att-table" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr>
                {/* Fixed columns: employee info */}
                <th className="l" style={{ minWidth: '100px' }}>Name</th>
                <th className="l" style={{ minWidth: '75px' }}>Job Title</th>
                <th style={{ minWidth: '38px' }}>{currencySymbol}/hr</th>

                {/* Dynamic day columns — one per day in the month */}
                {allDays.map(day => (
                  <th
                    key={day}
                    className={isWeekend(day) ? 'th-weekend' : ''}
                    style={{ minWidth: '20px', padding: '2px', fontSize: '8px' }}
                  >
                    {/* Day number on top, abbreviated day name below */}
                    {day}<br/>
                    <span style={{ opacity: .7, fontSize: '7px' }}>
                      {DAY_LABELS[getDayOfWeek(day)]}
                    </span>
                  </th>
                ))}

                {/* Fixed columns: summary */}
                <th style={{ minWidth: '38px' }}>Hrs</th>
                <th style={{ minWidth: '56px' }}>Amount</th>
                <th style={{ minWidth: '65px' }}>Signature</th>
              </tr>
            </thead>

            <tbody>
              {/* ── One row per employee ──────────────────────────────────── */}
              {overtime.rows.map((row, i) => {
                // hours is stored as { "3": 2, "7": 3, … }
                // keys are day numbers (as strings), value is hours worked
                const hours = row.hours as Record<string, number>
                return (
                  // Alternate row colour: even rows white, odd rows light grey
                  <tr key={row.id} className={i % 2 === 0 ? 'tr-even' : 'tr-odd'}>
                    <td className="l" style={{ fontWeight: 500 }}>{row.employee.name}</td>
                    <td className="l" style={{ color: '#6b7280' }}>{row.employee.jobTitle}</td>
                    {/* OT hourly rate shown in amber */}
                    <td style={{ fontWeight: 600, color: '#92400e' }}>{row.otRate}</td>

                    {/* ── OT Hour cells — one per day ──────────────────────── */}
                    {allDays.map(day => {
                      const val = hours[String(day)] || 0 // hours worked on this day (0 if none)
                      return (
                        <td
                          key={day}
                          className={[
                            // Always add amber tint to weekend columns as a base
                            isWeekend(day) ? 'td-weekend' : '',
                            // Add .td-has (amber text + bold) when hours > 0
                            // td-has is declared after td-weekend so it wins the cascade
                            val > 0 ? 'td-has' : '',
                          ].join(' ').trim()}
                          style={{ padding: '2px', fontSize: '8px' }}
                        >
                          {/* Show hours worked, or empty if zero */}
                          {val > 0 ? val : ''}
                        </td>
                      )
                    })}

                    {/* Summary columns at the end of each row */}
                    <td style={{ fontWeight: 700, color: '#92400e' }}>{row.totalHours}h</td>
                    <td style={{ fontWeight: 700, color: '#92400e' }}>{formatMoney(row.amount, currency)}</td>
                    <td style={{ color: '#9ca3af', fontStyle: 'italic' }}>{row.signature || ''}</td>
                  </tr>
                )
              })}

              {/* ── DAILY TOTAL ROW ───────────────────────────────────────── */}
              {/* Shows the sum of OT hours logged by all employees on each day */}
              <tr className="tr-total">
                <td className="l" colSpan={3} style={{ fontWeight: 700, color: '#374151' }}>
                  Daily total
                </td>
                {allDays.map(day => {
                  // Sum hours from all employees for this specific day
                  const total = overtime.rows.reduce((t, r) => {
                    const h = r.hours as Record<string, number>
                    return t + (h[String(day)] || 0)
                  }, 0)
                  return (
                    <td
                      key={day}
                      // Weekend columns still get amber tint in the total row
                      className={isWeekend(day) ? 'td-weekend' : ''}
                      style={{
                        fontSize: '8px', fontWeight: 700, padding: '2px',
                        // Amber text if any hours were logged, light grey if zero
                        color: total > 0 ? '#92400e' : '#d1d5db',
                      }}
                    >
                      {/* Show total hours with "h" suffix, or empty if zero */}
                      {total > 0 ? `${total}h` : ''}
                    </td>
                  )
                })}
                {/* Grand total hours and amount at the end of the total row */}
                <td style={{ fontWeight: 700, color: '#92400e' }}>{grandHours}h</td>
                <td style={{ fontWeight: 700, color: '#92400e' }}>{formatMoney(grandAmount, currency)}</td>
                <td/> {/* empty signature cell */}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── BOTTOM SECTION: Summary + Prepared By ────────────────────────── */}
        <div className="two-col">

          {/* LEFT: Summary table — total hours and payout */}
          <div>
            <p className="section-title">Summary</p>
            <table className="desc-table">
              <tbody>
                <tr>
                  <td>Total OT Hours</td>
                  <td><strong>{grandHours} hrs</strong></td>
                </tr>
                {/* Total payout row — grey background set by .desc-total */}
                <tr className="desc-total">
                  <td><strong>Total OT Payout</strong></td>
                  <td>
                    <strong style={{ color: '#92400e' }}>
                      {formatMoney(grandAmount, currency)}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT: Prepared By block with name and signature lines */}
          <div>
            <p className="section-title">Prepared By</p>
            {/* Name of the person who prepared the overtime sheet */}
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#111', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
              {overtime.preparedBy}
            </p>
            {/* Signature line — a labelled underline for manual signing */}
            <p className="sign-label">Signature:</p>
            <span className="sign-line"/>
            {/* Date line */}
            <p className="sign-label" style={{ marginTop: '12px' }}>Date:</p>
            <span className="sign-line" style={{ width: '120px' }}/>
          </div>

        </div>

      </div>{/* end .print-wrap */}
    </>
  )
}