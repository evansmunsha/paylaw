import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PayLaw Print',
}

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No sidebar, no topbar, no wrappers at all
  // Children render directly into the root layout's body
  return <>{children}</>
}