'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

// Each nav item has a label, a link, and an icon
const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/>
        <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/>
        <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/>
        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Paylaws',
    href: '/paylaws',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="5" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Overtime',
    href: '/overtime',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 4.5V8L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Employees',
    href: '/employees',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Summary',
    href: '/summary',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor"/>
        <rect x="6.5" y="6" width="3" height="9" rx="1" fill="currentColor"/>
        <rect x="12" y="2" width="3" height="13" rx="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
  label: 'Settings',
  href: '/settings',
  icon: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
},
]

export default function Sidebar() {
  // usePathname tells us which page we are on
  // so we can highlight the active nav item
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r
                      border-gray-100 flex flex-col z-50">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">PL</span>
          </div>
          <div>
            <div className="text-base font-bold tracking-widest leading-none">
              PAYLAW
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Construction Payroll
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">

        <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest
                      px-2 mb-2">
          Menu
        </p>

        {navItems.map(item => {
          // Check if this nav item matches the current page
          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                          transition-colors
                          ${isActive
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`}
            >
              {/* Icon — inherits the text color above */}
              <span className={isActive ? 'text-gray-900' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 flex flex-col gap-1">
        <Link
          href="/privacy"
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1
                    transition-colors"
        >
          Privacy Policy
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    text-gray-500 hover:bg-red-50 hover:text-red-600
                    transition-colors w-full"
        >
          {/* sign out icon */}
          Sign out
        </button>
      </div>

      {/* Sign out at the bottom */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-gray-500 hover:bg-red-50 hover:text-red-600
                     transition-colors w-full"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M10.5 11L14 8l-3.5-3" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="14" y1="8" x2="6" y2="8" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Sign out
        </button>
      </div>




    </aside>
  )
}