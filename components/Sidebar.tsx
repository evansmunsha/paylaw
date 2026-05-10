'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface NavItem {
  label: string
  href: string
  roles: string[]
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['admin', 'foreman'],
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5"
              stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5"
              stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5"
              stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5"
              stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    label: 'Paylaws',
    href: '/paylaws',
    roles: ['admin', 'foreman'],
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="2"
              stroke="currentColor" strokeWidth="1.3"/>
        <line x1="5" y1="5.5" x2="11" y2="5.5" stroke="currentColor"
              strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor"
              strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="5" y1="10.5" x2="8" y2="10.5" stroke="currentColor"
              strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Overtime',
    href: '/overtime',
    roles: ['admin', 'foreman'],
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor"
                strokeWidth="1.3"/>
        <path d="M8 5V8.5L10 10.5" stroke="currentColor"
              strokeWidth="1.3" strokeLinecap="round"
              strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    label: 'Employees',
    href: '/employees',
    roles: ['admin', 'foreman'],   // ← added foreman here
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor"
                strokeWidth="1.3"/>
        <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5"
              stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Summary',
    href: '/summary',
    roles: ['admin'],
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="9" width="3.5" height="6" rx="1"
              stroke="currentColor" strokeWidth="1.3"/>
        <rect x="6.25" y="6" width="3.5" height="9" rx="1"
              stroke="currentColor" strokeWidth="1.3"/>
        <rect x="11.5" y="2" width="3.5" height="13" rx="1"
              stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['admin'],
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor"
                strokeWidth="1.3"/>
        <path d="M8 1.5v1.1M8 13.4v1.1M1.5 8h1.1M13.4 8h1.1
                 M3.4 3.4l.78.78M11.82 11.82l.78.78
                 M3.4 12.6l.78-.78M11.82 4.18l.78-.78"
              stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Team',
    href: '/settings/team',
    roles: ['admin'],
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="5.5" cy="5" r="2" stroke="currentColor"
                strokeWidth="1.3"/>
        <circle cx="11" cy="5" r="1.5" stroke="currentColor"
                strokeWidth="1.3"/>
        <path d="M1 13c0-2.5 2.015-4 4.5-4s4.5 1.5 4.5 4"
              stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round"/>
        <path d="M11 9c1.8 0 3.5 1 3.5 3.5"
              stroke="currentColor" strokeWidth="1.3"
              strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname          = usePathname()
  const { data: session } = useSession()
  const role              = session?.user?.role || 'admin'
  const site              = session?.user?.site

  // Only show nav items the current role is allowed to see
  const visibleItems = navItems.filter(item => item.roles.includes(role))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed left-0 top-0 h-full w-56 bg-white
                    border-r border-gray-100 flex flex-col z-40
                    hidden md:flex">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center
                          justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <span className="text-base font-bold tracking-widest text-gray-900">
            PAYLAW
          </span>
        </div>

        {/* Role badge */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full
            ${role === 'admin'
              ? 'bg-gray-100 text-gray-600'
              : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
            {role === 'admin' ? 'Admin' : 'Foreman'}
          </span>
          {role === 'foreman' && site && (
            <span className="text-xs text-gray-400 truncate">
              {site}
            </span>
          )}
        </div>
      </div>

      {/* Foreman site banner */}
      {role === 'foreman' && site && (
        <div className="mx-3 mt-3 bg-blue-50 border border-blue-100
                        rounded-lg px-3 py-2">
          <p className="text-xs text-blue-500 font-medium mb-0.5">
            Your site
          </p>
          <p className="text-xs font-semibold text-blue-800">{site}</p>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {visibleItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                          text-sm transition-colors
                ${active
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
            >
              <span className={active ? 'text-gray-900' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom — user info and sign out */}
      <div className="px-3 py-4 border-t border-gray-100">
        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
          <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center
                          justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {session?.user?.name?.[0]?.toUpperCase() ||
               session?.user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Privacy policy — only for admins */}
        {role === 'admin' && (
          <Link
            href="/privacy"
            className="flex items-center gap-3 px-3 py-2 rounded-lg
                       text-xs text-gray-400 hover:text-gray-600
                       hover:bg-gray-50 transition-colors"
          >
            Privacy Policy
          </Link>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                     text-sm text-gray-500 hover:bg-red-50
                     hover:text-red-600 transition-colors mt-0.5"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round"/>
            <path d="M10.5 11L14 8l-3.5-3M14 8H6"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  )
}