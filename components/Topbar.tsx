'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0].toUpperCase() ?? '?'

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center
                       justify-between px-4 md:px-6 sticky top-0 z-40">

      <div className="min-w-0 flex-1">
        <h1 className="text-sm md:text-base font-semibold text-gray-900
                       leading-none truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* Avatar + dropdown */}
      <div className="relative shrink-0 ml-3">
        <button
          onClick={() => setShowMenu(prev => !prev)}
          className="w-8 h-8 bg-gray-900 rounded-full flex items-center
                     justify-center text-white text-xs font-bold"
        >
          {initials}
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 top-10 z-50 bg-white border
                            border-gray-200 rounded-xl shadow-lg py-1 w-44">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {session?.user?.name || session?.user?.email}
                </p>
                <p className="text-xs text-gray-400">Administrator</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left px-3 py-2 text-sm text-red-600
                           hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}