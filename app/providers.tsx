'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    // Register the service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW failed:', err))
    }
  }, [])

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}