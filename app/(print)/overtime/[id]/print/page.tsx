import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import PrintButton from './PrintButton'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const ot = await prisma.overtime.findFirst({ where: { id } })
  if (!ot) return { title: 'Overtime Print' }
  const month = MONTH_NAMES[ot.month - 1]
  return {
    title: `Overtime — ${ot.site} — ${month} ${ot.year}`,
  }
}

export default async function PrintOvertimePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { id } = await params

  const [overtime, settings] = await Promise.all([
    prisma.overtime.findFirst({
      where: { id, userId: session.user.id },
      include: { rows: { include: { employee: true } } },
    }),
    prisma.settings.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  if (!overtime) notFound()

  const monthName   = MONTH_NAMES[overtime.month - 1]
  const daysInMonth = new Date(overtime.year, overtime.month, 0).getDate()
  const allDays     = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getDayOfWeek(day: number) {
    return new Date(overtime!.year, overtime!.month - 1, day).getDay()
  }

  function isWeekend(day: number) {
    const d = getDayOfWeek(day)
    return d === 0 || d === 6
  }

  const grandHours  = overtime.rows.reduce((t, r) => t + r.totalHours, 0)
  const grandAmount = overtime.rows.reduce((t, r) => t + r.amount, 0)

  return (
    <>
      <style>{`
        /* ── Force ALL backgrounds & colors to print ── */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        body { margin: 0 !important; padding: 0 !important; background: #f9fafb; }

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
        .print-back { font-size: 13px; color: #6b7280; text-decoration: none; }
        .print-back:hover { color: #111; }
        .print-mid  { font-size: 13px; font-weight: 500; color: #374151; }

        .print-wrap {
          background: white;
          padding: 24px 32px;
          min-height: 100vh;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .doc-header {
          text-align: center;
          border-bottom: 2px solid #111;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 3px; }
        .doc-title    { font-size: 20px; font-weight: 800; letter-spacing: 0.15em; color: #111; }
        .contact-line { font-size: 10px; color: #6b7280; margin-top: 4px; }
        .period-line  { font-size: 11px; color: #374151; margin-top: 6px; }

        .att-table-wrap { overflow-x: auto; }
        .att-table { border-collapse: collapse; font-size: 10px; width: 100%; }

        .att-table th {
          background: #78350f !important;
          color: white !important;
          padding: 3px 5px;
          font-weight: 600;
          text-align: center;
          border: 1px solid #92400e;
          white-space: nowrap;
        }
        .att-table th.l { text-align: left; }

        .att-table td {
          border: 1px solid #d1d5db;
          padding: 3px 5px;
          text-align: center;
          font-size: 10px;
          white-space: nowrap;
        }
        .att-table td.l { text-align: left; }

        /* OT hours cell */
        .td-has     { background: #fffbeb !important; color: #92400e !important; font-weight: 700; }
        /* Weekend header */
        .th-weekend { background: #451a03 !important; color: white !important; }
        /* Weekend body cell */
        .td-weekend { background: #fffbeb !important; }
        /* Alternating rows */
        .tr-odd     { background: #f9fafb !important; }
        /* Totals row */
        .tr-total   { background: #f3f4f6 !important; font-weight: 700; }

        .section-title {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: #374151; margin-bottom: 6px; margin-top: 14px;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .two-col {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 24px; margin-top: 16px;
        }
        .desc-table { width: 100%; border-collapse: collapse; }
        .desc-table td { border: 1px solid #e5e7eb; padding: 4px 8px; text-align: left; font-size: 10px; }
        .desc-total { background: #f3f4f6 !important; font-weight: 700; }

        .sign-line  { display: block; border-bottom: 1px solid #9ca3af; width: 180px; margin-top: 20px; }
        .sign-label { font-size: 10px; color: #6b7280; margin-top: 8px; font-family: 'Segoe UI', Arial, sans-serif; }

        @media print {
          .print-toolbar { display: none !important; }
          body { background: white !important; }
          .print-wrap { padding: 0; }
          .att-table-wrap { overflow: visible !important; }
          .att-table { font-size: 7px !important; width: 100% !important; }
          .att-table th, .att-table td { padding: 2px 3px !important; font-size: 7px !important; }
          .att-table th.l, .att-table td.l { min-width: 60px !important; }
        }
        @page { size: A4 landscape; margin: 8mm; }
      `}</style>

      <div className="print-toolbar">
        <a href={`/overtime/${overtime.id}`} className="print-back">← Back</a>
        <span className="print-mid">{overtime.site} — {monthName} {overtime.year}</span>
        <PrintButton />
      </div>

      <div className="print-wrap">

        <div className="doc-header">
          {settings?.companyName && (
            <p className="company-name">{settings.companyName}</p>
          )}
          <p className="doc-title">OVERTIME SHEET</p>
          {(settings?.phone || settings?.email || settings?.address) && (
            <p className="contact-line">
              {[settings.phone, settings.email, settings.address].filter(Boolean).join('  |  ')}
            </p>
          )}
          <p className="period-line">
            Site: <strong>{overtime.site}</strong>
            &nbsp;·&nbsp;
            Period: <strong>{monthName} {overtime.year}</strong>
          </p>
        </div>

        <div className="att-table-wrap">
          <table className="att-table" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr>
                <th className="l" style={{ minWidth: '100px' }}>Name</th>
                <th className="l" style={{ minWidth: '75px' }}>Job Title</th>
                <th style={{ minWidth: '38px' }}>K/hr</th>
                {allDays.map(day => (
                  <th
                    key={day}
                    className={isWeekend(day) ? 'th-weekend' : ''}
                    style={{ minWidth: '20px', padding: '2px', fontSize: '8px' }}
                  >
                    {day}<br/>
                    <span style={{ opacity: .7, fontSize: '7px' }}>
                      {DAY_LABELS[getDayOfWeek(day)]}
                    </span>
                  </th>
                ))}
                <th style={{ minWidth: '38px' }}>Hrs</th>
                <th style={{ minWidth: '56px' }}>Amount</th>
                <th style={{ minWidth: '65px' }}>Signature</th>
              </tr>
            </thead>
            <tbody>
              {overtime.rows.map((row, i) => {
                const hours = row.hours as Record<string, number>
                return (
                  <tr key={row.id} className={i % 2 === 0 ? 'tr-even' : 'tr-odd'}>
                    <td className="l" style={{ fontWeight: 500 }}>{row.employee.name}</td>
                    <td className="l" style={{ color: '#6b7280' }}>{row.employee.jobTitle}</td>
                    <td style={{ fontWeight: 600, color: '#92400e' }}>{row.otRate}</td>
                    {allDays.map(day => {
                      const val = hours[String(day)] || 0
                      return (
                        <td
                          key={day}
                          className={val > 0 ? 'td-has' : isWeekend(day) ? 'td-weekend' : ''}
                          style={{ padding: '2px', fontSize: '8px' }}
                        >
                          {val > 0 ? val : ''}
                        </td>
                      )
                    })}
                    <td style={{ fontWeight: 700, color: '#92400e' }}>{row.totalHours}h</td>
                    <td style={{ fontWeight: 700, color: '#92400e' }}>K {row.amount.toLocaleString()}</td>
                    <td style={{ color: '#9ca3af', fontStyle: 'italic' }}>{row.signature || ''}</td>
                  </tr>
                )
              })}

              <tr className="tr-total">
                <td className="l" colSpan={3} style={{ fontWeight: 700, color: '#374151' }}>
                  Daily total
                </td>
                {allDays.map(day => {
                  const total = overtime.rows.reduce((t, r) => {
                    const h = r.hours as Record<string, number>
                    return t + (h[String(day)] || 0)
                  }, 0)
                  return (
                    <td key={day} style={{
                      fontSize: '8px', fontWeight: 700, padding: '2px',
                      color: total > 0 ? '#92400e' : '#d1d5db',
                    }}>
                      {total > 0 ? `${total}h` : ''}
                    </td>
                  )
                })}
                <td style={{ fontWeight: 700, color: '#92400e' }}>{grandHours}h</td>
                <td style={{ fontWeight: 700, color: '#92400e' }}>K {grandAmount.toLocaleString()}</td>
                <td/>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="two-col">
          <div>
            <p className="section-title">Summary</p>
            <table className="desc-table">
              <tbody>
                <tr><td>Total OT Hours</td><td><strong>{grandHours} hrs</strong></td></tr>
                <tr className="desc-total">
                  <td><strong>Total OT Payout</strong></td>
                  <td><strong style={{ color: '#92400e' }}>K {grandAmount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="section-title">Prepared By</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#111', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
              {overtime.preparedBy}
            </p>
            <p className="sign-label">Signature:</p>
            <span className="sign-line"/>
            <p className="sign-label" style={{ marginTop: '12px' }}>Date:</p>
            <span className="sign-line" style={{ width: '120px' }}/>
          </div>
        </div>

      </div>
    </>
  )
}