'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { data: session } = useSession()
  const [showMenu, setShowMenu]         = useState(false)
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled]   = useState(false)
  const [isIOS, setIsIOS]               = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (!installEvent) return
    await installEvent.prompt()
    const result = await installEvent.userChoice
    if (result.outcome === 'accepted') setIsInstalled(true)
  }

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.[0].toUpperCase() ?? '?'

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-100
                         flex items-center justify-between px-4 md:px-6
                         sticky top-0 z-40">

        <div className="min-w-0 flex-1">
          <h1 className="text-sm md:text-base font-semibold
                         text-gray-900 leading-none truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 truncate
                          hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-3">

          {/* Install button — only show if not installed */}
          {!isInstalled && (
            <button
              onClick={handleInstall}
              title="Install PayLaw app"
              className="flex items-center gap-1.5 text-xs border
                         border-gray-200 px-3 py-1.5 rounded-lg
                         text-gray-600 hover:bg-gray-50 transition-colors
                         hidden sm:flex"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 9h8M6 1v6M3.5 4.5L6 7L8.5 4.5"
                      stroke="currentColor" strokeWidth="1.4"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Install app
            </button>
          )}

          {/* Avatar + dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="w-8 h-8 bg-gray-900 rounded-full flex items-center
                         justify-center text-white text-xs font-bold"
            >
              {initials}
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-10 z-50 bg-white
                                border border-gray-200 rounded-xl
                                shadow-lg py-1 w-48">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-900
                                   truncate">
                      {session?.user?.name || session?.user?.email}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {session?.user?.role || 'Admin'}
                    </p>
                  </div>

                  {/* Install option in dropdown for mobile */}
                  {!isInstalled && (
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleInstall()
                      }}
                      className="w-full text-left px-3 py-2 text-sm
                                 text-gray-600 hover:bg-gray-50
                                 transition-colors flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14"
                           fill="none">
                        <path d="M2 10h10M7 2v6M4 5.5L7 8.5L10 5.5"
                              stroke="currentColor" strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"/>
                      </svg>
                      Install app
                    </button>
                  )}

                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full text-left px-3 py-2 text-sm
                               text-red-600 hover:bg-red-50
                               transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* iOS install guide modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end
                     justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm
                       shadow-xl mb-4"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Install PayLaw on your phone
            </h3>
            <div className="flex flex-col gap-4">
              {[
                {
                  n: 1,
                  title: 'Tap the Share button',
                  desc: 'Bottom of Safari — the box with arrow pointing up',
                },
                {
                  n: 2,
                  title: 'Tap Add to Home Screen',
                  desc: 'Scroll down in the share sheet to find it',
                },
                {
                  n: 3,
                  title: 'Tap Add',
                  desc: 'PayLaw appears on your home screen like a real app',
                },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center
                                   justify-center text-sm font-bold
                                   flex-shrink-0
                    ${step.n === 3
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700'}`}>
                    {step.n}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-5 bg-black text-white text-sm
                         font-medium py-3 rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}