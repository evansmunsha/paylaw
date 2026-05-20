import StructuredData from '@/components/StructuredData'

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <StructuredData />
      {children}
    </div>
  )
}