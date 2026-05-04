import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {}, // tells Next.js 16 we are using Turbopack — silences the error
}

export default nextConfig