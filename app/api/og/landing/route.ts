import sharp from 'sharp'

const siteTitle = 'PayLaw — Construction Payroll'
const siteSubtitle = 'Sample PDF payroll preview for share cards'
const sampleLines = [
  'Attendance, overtime, salaries, deductions',
  'Clean PDF payslip ready to download',
  'Shared from PayLaw — simple construction payroll',
]

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
    .title { font-family: Inter, sans-serif; font-weight: 800; font-size: 54px; fill: #0f172a }
    .subtitle { font-family: Inter, sans-serif; font-weight: 600; font-size: 24px; fill: #111827; opacity: .85 }
    .label { font-family: Inter, sans-serif; font-weight: 600; font-size: 16px; fill: #ffffff; opacity: .88 }
    .text { font-family: Inter, sans-serif; font-weight: 500; font-size: 18px; fill: #111827; opacity: .9 }
    .accent { fill: #16a34a }
  </style>
  <rect width="1200" height="630" fill="#0f172a" />
  <rect x="56" y="56" width="1088" height="518" rx="32" fill="#ffffff" />
  <rect x="88" y="88" width="512" height="444" rx="22" fill="#f8fafc" stroke="#e5e7eb" stroke-width="2" />
  <rect x="660" y="88" width="424" height="130" rx="20" fill="#111827" />
  <text x="690" y="134" class="title">${escapeXml(siteTitle)}</text>
  <text x="690" y="182" class="subtitle">${escapeXml(siteSubtitle)}</text>
  <rect x="690" y="210" width="352" height="60" rx="14" fill="#16a34a" />
  <text x="720" y="250" class="label">Sample PDF preview</text>
  <text x="100" y="162" class="text">Example payslip</text>
  <rect x="100" y="190" width="432" height="52" rx="10" fill="#e5e7eb" />
  <text x="120" y="228" class="text">Worker: J. Banda</text>
  <text x="100" y="268" class="text">Site: Kafue Road</text>
  <text x="100" y="306" class="text">Month: May 2026</text>
  <rect x="100" y="340" width="432" height="180" rx="14" fill="#e5e7eb" />
  <text x="120" y="378" class="text">Net pay: ZMW 16,240.00</text>
  <text x="120" y="408" class="text">Overtime: ZMW 2,160.00</text>
  <text x="120" y="438" class="text">Deductions: ZMW 240.00</text>
  <text x="120" y="468" class="text">Total PDF ready to download</text>
  <g transform="translate(660, 320)">
    <rect x="0" y="0" width="424" height="210" rx="24" fill="#f8fafc" stroke="#e5e7eb" />
    <text x="30" y="50" class="text">Shareable payroll snapshot</text>
    ${sampleLines
      .map((line, index) =>
        `<text x="30" y="110" class="text">• ${escapeXml(line)}</text>`)
      .join('')}
  </g>
  <text x="100" y="560" class="subtitle">PayLaw — payroll for site managers</text>
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
