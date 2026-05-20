import { prisma } from '@/lib/prisma'

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app').replace(/\/$/, '')

  // Static pages
  const pages = [
    { loc: `${base}/`, priority: '1.00' },
    { loc: `${base}/pricing`, priority: '0.80' },
    { loc: `${base}/privacy`, priority: '0.64' },
    { loc: `${base}/register`, priority: '0.80' },
    { loc: `${base}/login`, priority: '0.64' },
    { loc: `${base}/paylaws`, priority: '0.80' },
  ]

  // Fetch public paylaws
  const paylaws = await prisma.paylaw.findMany({
    where: { public: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true },
  })

  const urls = pages.map(p => `  <url>\n    <loc>${p.loc}</loc>\n    <priority>${p.priority}</priority>\n  </url>`).join('\n')

  const paylawUrls = paylaws.map(p => `  <url>\n    <loc>${base}/paylaws/${p.id}</loc>\n    <lastmod>${p.createdAt.toISOString()}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`).join('\n')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n${paylawUrls}\n</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
