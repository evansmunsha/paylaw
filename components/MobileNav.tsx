'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const allNavItems = [
  {
    label: 'Home',
    href: '/dashboard',
    roles: ['admin', 'foreman'],
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7" height="7" rx="1.5"
              stroke="currentColor" strokeWidth="1.4"
              fill={active ? 'currentColor' : 'none'}/>
        <rect x="11" y="2" width="7" height="7" rx="1.5"
              stroke="currentColor" strokeWidth="1.4"
              fill={active ? 'currentColor' : 'none'}/>
        <rect x="2" y="11" width="7" height="7" rx="1.5"
              stroke="currentColor" strokeWidth="1.4"
              fill={active ? 'currentColor' : 'none'}/>
        <rect x="11" y="11" width="7" height="7" rx="1.5"
              stroke="currentColor" strokeWidth="1.4"
              fill={active ? 'currentColor' : 'none'}/>
      </svg>
    ),
  },
  {
    label: 'Paylaws',
    href: '/paylaws',
    roles: ['admin', 'foreman'],
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="2"
              stroke="currentColor" strokeWidth="1.4"/>
        <line x1="7" y1="7" x2="13" y2="7" stroke="currentColor"
              strokeWidth={active ? '2' : '1.4'} strokeLinecap="round"/>
        <line x1="7" y1="10" x2="13" y2="10" stroke="currentColor"
              strokeWidth={active ? '2' : '1.4'} strokeLinecap="round"/>
        <line x1="7" y1="13" x2="10" y2="13" stroke="currentColor"
              strokeWidth={active ? '2' : '1.4'} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'OT',
    href: '/overtime',
    roles: ['admin', 'foreman'],
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor"
                strokeWidth="1.4"/>
        <path d="M10 6V10.5L12.5 13" stroke="currentColor"
              strokeWidth={active ? '2' : '1.4'} strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Staff',
    href: '/employees',
    roles: ['admin', 'foreman'],   // ← added foreman here
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3" stroke="currentColor"
                strokeWidth="1.4"
                fill={active ? 'currentColor' : 'none'}/>
        <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5"
              stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'Summary',
    href: '/summary',
    roles: ['admin'],
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="11" width="4" height="7" rx="1"
              fill={active ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="1.4"/>
        <rect x="8" y="7" width="4" height="11" rx="1"
              fill={active ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="1.4"/>
        <rect x="14" y="2" width="4" height="16" rx="1"
              fill={active ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['admin'],
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3"
                fill={active ? 'currentColor' : 'none'}
                stroke="currentColor" strokeWidth="1.4"/>
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2
                 M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4
                 M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"
              stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function MobileNav() {
  const pathname          = usePathname()
  const { data: session } = useSession()
  const role              = session?.user?.role || 'admin'

  // Filter by role
  const visibleItems = allNavItems.filter(item => item.roles.includes(role))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white
                    border-t border-gray-200"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5
                          rounded-xl transition-colors min-w-0
                          ${active ? 'text-gray-900' : 'text-gray-400'}`}
            >
              {item.icon(active)}
              <span className={`text-xs font-medium leading-none
                ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}