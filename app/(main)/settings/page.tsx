import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Settings"
        subtitle="Company info printed on every PDF"
      />
      <SettingsClient
        initial={{
          companyName: settings?.companyName || '',
          siteName:    settings?.siteName    || '',
          phone:       settings?.phone       || '',
          email:       settings?.email       || '',
          address:     settings?.address     || '',
        }}
      />
    </div>
  )
}