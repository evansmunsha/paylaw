import sharp from 'sharp'

const siteTitle = 'PAYLAW'
const siteSubtitle = 'Construction payroll PDF preview'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <style>
    .bg { fill: #0f172a }
    .card { fill: #ffffff; stroke: #e5e7eb; stroke-width: 1.5 }
    .title { font-family: Inter, sans-serif; font-size: 52px; font-weight: 800; fill: #111827 }
    .label { font-family: Inter, sans-serif; font-size: 16px; font-weight: 700; fill: #6b7280 }
    .subtitle { font-family: Inter, sans-serif; font-size: 20px; font-weight: 600; fill: #111827; opacity: .85 }
    .note { font-family: Inter, sans-serif; font-size: 16px; fill: #111827 }
    .small { font-family: Inter, sans-serif; font-size: 14px; fill: #374151 }
    .table-head { font-family: Inter, sans-serif; font-size: 13px; font-weight: 700; fill: #ffffff }
    .table-cell { font-family: Inter, sans-serif; font-size: 12px; fill: #111827 }
    .table-amount { font-family: Inter, sans-serif; font-size: 13px; font-weight: 700; fill: #15803d }
    .badge { fill: #16a34a }
    .badge-text { font-family: Inter, sans-serif; font-size: 13px; font-weight: 700; fill: #ffffff }
    .divider { stroke: #e5e7eb; stroke-width: 1 }
  </style>
  <rect width="1200" height="630" class="bg" />
  <rect x="60" y="50" width="1080" height="530" rx="32" class="card" />

  <text x="100" y="120" class="label">Evans AI Labs</text>
  <text x="100" y="160" class="title">${escapeXml(siteTitle)}</text>
  <text x="100" y="198" class="small">lusaka · May 2026</text>
  <text x="100" y="228" class="note">Sample payroll PDF preview for construction site payslips.</text>

  <rect x="100" y="250" width="980" height="38" rx="10" fill="#111827" />
  <text x="120" y="278" class="table-head">Name</text>
  <text x="330" y="278" class="table-head">Job Title</text>
  <text x="560" y="278" class="table-head">K/day</text>
  <text x="700" y="278" class="table-head">Days</text>
  <text x="820" y="278" class="table-head">Amount</text>
  <text x="980" y="278" class="table-head">Signature</text>

  <rect x="100" y="292" width="980" height="44" rx="10" fill="#f8fafc" />
  <text x="120" y="322" class="table-cell">Adson Phiri</text>
  <text x="330" y="322" class="table-cell">Site manager</text>
  <text x="560" y="322" class="table-cell">K 4,000</text>
  <text x="700" y="322" class="table-cell">9</text>
  <text x="820" y="322" class="table-amount">K 36,000</text>
  <text x="980" y="322" class="small">✓</text>

  <line x1="100" y1="350" x2="1080" y2="350" class="divider" />
  <text x="100" y="384" class="label">DESCRIPTION</text>
  <text x="100" y="412" class="small">Salaries</text>
  <text x="980" y="412" class="table-amount">K 36,000</text>
  <text x="100" y="436" class="small">Overtime</text>
  <text x="980" y="436" class="table-cell">See OT sheet</text>
  <text x="100" y="460" class="small">Food Expense</text>
  <text x="980" y="460" class="table-cell">K 0</text>
  <text x="100" y="484" class="small">Other Deductions</text>
  <text x="980" y="484" class="table-cell">K 0</text>

  <rect x="100" y="510" width="980" height="74" rx="18" fill="#f3f4f6" />
  <text x="120" y="544" class="label">Total Amount Spent</text>
  <text x="980" y="544" class="table-amount">K 36,000</text>
  <text x="100" y="572" class="small">PDF-ready export • clean construction payroll summary</text>

  <rect x="920" y="120" width="160" height="34" rx="12" class="badge" />
  <text x="940" y="143" class="badge-text">PDF sample</text>
</svg>`
}

export async function GET() {
  const svg = renderSvg()
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer()

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
