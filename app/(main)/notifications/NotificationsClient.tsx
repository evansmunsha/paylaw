'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  entityType: string
  entityId: string
  read: boolean
  createdAt: Date
}

interface Props {
  notifications: Notification[]
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins} minutes ago`
  if (hrs  < 24) return `${hrs} hours ago`
  if (days === 1) return 'Yesterday'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function typeIcon(type: string) {
  if (type === 'approved')  return { icon: '✅', bg: 'bg-green-50', border: 'border-green-100' }
  if (type === 'rejected')  return { icon: '❌', bg: 'bg-red-50',   border: 'border-red-100' }
  if (type === 'submitted') return { icon: '📋', bg: 'bg-blue-50',  border: 'border-blue-100' }
  return { icon: '🔔', bg: 'bg-gray-50', border: 'border-gray-100' }
}

export default function NotificationsClient({ notifications }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(notifications)

  const unreadCount = items.filter(n => !n.read).length

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'POST' })
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleClick(n: Notification) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
      setItems(prev => prev.map(x =>
        x.id === n.id ? { ...x, read: true } : x
      ))
    }

    const path = n.entityType === 'paylaw'
      ? `/paylaws/${n.entityId}`
      : `/overtime/${n.entityId}`

    router.push(path)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {items.length} notification{items.length !== 1 ? 's' : ''}
          {unreadCount > 0 && (
            <span className="ml-2 text-xs bg-red-50 text-red-600
                             border border-red-100 px-2 py-0.5
                             rounded-full font-medium">
              {unreadCount} unread
            </span>
          )}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-gray-500 hover:text-gray-800
                       border border-gray-200 px-3 py-1.5 rounded-lg
                       hover:bg-gray-50 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      {items.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl
                        py-16 text-center">
          <p className="text-3xl mb-3">🔔</p>
          <p className="text-sm text-gray-400">No notifications yet</p>
          <p className="text-xs text-gray-300 mt-1">
            You will be notified when something needs your attention
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(n => {
            const style = typeIcon(n.type)
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`bg-white border rounded-xl p-4 text-left
                            hover:shadow-sm transition-all w-full
                            ${!n.read
                              ? 'border-blue-100 bg-blue-50/30'
                              : 'border-gray-100'}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center
                                   justify-center shrink-0 text-xl
                                   border ${style.bg} ${style.border}`}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold
                        ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-gray-400">
                          {timeAgo(n.createdAt)}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"/>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Click to view →
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}