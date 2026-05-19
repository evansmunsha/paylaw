import { prisma } from '@/lib/prisma'
import sharp from 'sharp'
import { formatMoney, getCurrencySymbol } from '@/lib/currency'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderSvg(paylaw: any, currency: string) {
  const totalNormal = paylaw.rows.reduce((sum: number, row: any) => sum + row.amount, 0)
  const title = `Paylaw — ${paylaw.site}`
  const subtitle = `${MONTH_NAMES[paylaw.month - 1]} ${paylaw.year}`
  const workers = `${paylaw.rows.length} worker${paylaw.rows.length === 1 ? '' : 's'}`
  const amount = `${getCurrencySymbol(currency)} ${formatMoney(totalNormal, currency)}`
  // Render a PDF-like mock card for a stronger social preview
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <style>
    .title { font-family: Inter, sans-serif; font-weight: 700; fill: #111827 }
    .muted { font-family: Inter, sans-serif; fill: #6b7280 }
    .label { font-family: Inter, sans-serif; font-weight: 600; fill: #111827 }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace; fill: #111827 }
  </style>
  <rect width="1200" height="630" fill="#0f172a" />
  <rect x="56" y="48" width="1096" height="534" rx="12" fill="#ffffff" />

  <!-- Left: document mockup -->
  <g transform="translate(96,96)">
    <rect x="0" y="0" width="560" height="420" rx="10" fill="#f8fafc" stroke="#e5e7eb" />
    <text x="28" y="44" class="title" font-size="28">${escapeXml(paylaw.site)}</text>
    <text x="28" y="80" class="muted" font-size="16">${escapeXml(subtitle)}</text>

    <!-- table header -->
    <rect x="28" y="110" width="504" height="34" rx="6" fill="#111827" />
    <text x="44" y="132" fill="#ffffff" font-family="Inter, sans-serif" font-size="16" font-weight="700">Name</text>
    <text x="380" y="132" fill="#ffffff" font-family="Inter, sans-serif" font-size="16" font-weight="700">Days</text>

    <!-- sample rows -->
    <text x="44" y="170" class="mono" font-size="14">J. Banda</text>
    <text x="380" y="170" class="mono" font-size="14">22</text>
    <text x="44" y="198" class="mono" font-size="14">P. Mwale</text>
    <text x="380" y="198" class="mono" font-size="14">18</text>
    <text x="44" y="226" class="mono" font-size="14">G. Phiri</text>
    <text x="380" y="226" class="mono" font-size="14">20</text>

    <rect x="28" y="280" width="504" height="80" rx="8" fill="#111827" />
    <text x="44" y="312" fill="#ffffff" font-size="14" font-weight="700">Total salary</text>
    <text x="44" y="348" fill="#ffffff" font-size="28" font-weight="700">${escapeXml(amount)}</text>
  </g>

  <!-- Right: summary panel -->
  <g transform="translate(720,120)">
    <rect x="0" y="0" width="340" height="360" rx="10" fill="#f8fafc" stroke="#e5e7eb" />
    <text x="24" y="40" class="label" font-size="20">${escapeXml(title)}</text>
    <text x="24" y="72" class="muted" font-size="14">Prepared by ${escapeXml(paylaw.preparedBy)}</text>
    <text x="24" y="110" class="muted" font-size="13">${escapeXml(workers)}</text>

    <rect x="24" y="140" width="292" height="86" rx="8" fill="#111827" />
    <text x="40" y="172" fill="#ffffff" font-size="13">Net pay</text>
    <text x="40" y="210" fill="#10b981" font-size="28" font-weight="700">${escapeXml(amount)}</text>

    <text x="24" y="260" class="muted" font-size="12">PDF ready • Shareable</text>
    <text x="24" y="286" class="muted" font-size="12">ID: ${escapeXml(paylaw.id)}</text>
  </g>

</svg>`
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const paylaw = await prisma.paylaw.findUnique({
    where: { id },
    include: { rows: true },
  })

  if (!paylaw) {
    return new Response('Not found', { status: 404 })
  }

  const currency = 'ZMW'
  const svg = renderSvg(paylaw, currency)
  const image = await sharp(Buffer.from(svg)).png().toBuffer()

  return new Response(new Uint8Array(image), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
