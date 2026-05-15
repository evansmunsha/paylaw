'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  entityType: string
  entityId: string
  read: boolean
  createdAt: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs  < 24) return `${hrs}h ago`
  return `${days}d ago`
}

function typeIcon(type: string) {
  if (type === 'approved') return '✅'
  if (type === 'rejected') return '❌'
  if (type === 'submitted') return '📋'
  return '🔔'
}

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [unread, setUnread]     = useState(0)
  const [items, setItems]       = useState<Notification[]>([])
  const [loading, setLoading]   = useState(false)
  const ref                     = useRef<HTMLDivElement>(null)

  // Fetch unread count every 30 seconds
  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchCount() {
    try {
      const res  = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setUnread(data.unreadCount || 0)
    } catch {}
  }

  async function handleOpen() {
    if (open) {
      setOpen(false)
      return
    }

    setOpen(true)
    setLoading(true)

    try {
      const res  = await fetch('/api/notifications')
      const data = await res.json()
      setItems(data.notifications || [])
      setUnread(data.unreadCount  || 0)
    } catch {} finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'POST' })
    setUnread(0)
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleNotificationClick(n: Notification) {
    // Mark as read
    await fetch(`/api/notifications/${n.id}/read`, { method: 'POST' })
    setItems(prev => prev.map(x =>
      x.id === n.id ? { ...x, read: true } : x
    ))
    setUnread(prev => Math.max(prev - (n.read ? 0 : 1), 0))

    // Navigate to the relevant page
    const path = n.entityType === 'paylaw'
      ? `/paylaws/${n.entityId}`
      : `/overtime/${n.entityId}`

    setOpen(false)
    router.push(path)
  }

  return (
    <div ref={ref} className="relative">

      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center
                   rounded-lg hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a5.5 5.5 0 00-5.5 5.5v3l-1.5 2h14l-1.5-2v-3A5.5 5.5 0 009 2z"
                stroke="currentColor" strokeWidth="1.4"
                strokeLinejoin="round"/>
          <path d="M7.5 14.5a1.5 1.5 0 003 0"
                stroke="currentColor" strokeWidth="1.4"
                strokeLinecap="round"/>
        </svg>

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4
                           bg-red-500 text-white text-xs font-bold
                           rounded-full flex items-center justify-center
                           leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 z-50 bg-white border
                        border-gray-200 rounded-2xl shadow-xl w-80
                        max-h-96 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
                          border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">
                Notifications
              </p>
              {unread > 0 && (
                <span className="text-xs bg-red-50 text-red-600 border
                                 border-red-100 px-1.5 py-0.5 rounded-full
                                 font-medium">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-gray-400 hover:text-gray-700
                           transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400">Loading...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-2xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  You will be notified when something needs your attention
                </p>
              </div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b
                              border-gray-50 hover:bg-gray-50
                              transition-colors
                    ${!n.read ? 'bg-blue-50/40' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">
                      {typeIcon(n.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold
                        ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5
                                    leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full
                                       shrink-0 mt-1"/>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100
                            shrink-0">
              <button
                onClick={() => {
                  setOpen(false)
                  router.push('/notifications')
                }}
                className="text-xs text-gray-400 hover:text-gray-700
                           w-full text-center transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}