import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Topbar from '@/components/Topbar'
import NotificationsClient from './NotificationsClient'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    100,
  })

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Notifications"
        subtitle="All your alerts and updates"
      />
      <NotificationsClient notifications={notifications} />
    </div>
  )
}