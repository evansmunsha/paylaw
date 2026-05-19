'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS]               = useState(false)
  const [isInstalled, setIsInstalled]   = useState(false)
  const [show, setShow]                 = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Already installed as standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // On iOS show the button after 3 seconds
    // because beforeinstallprompt never fires on iOS
    if (ios) {
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    // On Chrome/Edge listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    const appInstalled = () => setIsInstalled(true)

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', appInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalled)
    }
  }, [])

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (!installEvent) return
    await installEvent.prompt()
    const result = await installEvent.userChoice
    if (result.outcome === 'accepted') {
      setShow(false)
      setIsInstalled(true)
    }
  }

  if (isInstalled || !show) return null

  return (
    <>
      {/* Install banner */}
      <div className="fixed z-50 inset-x-0 md:left-1/2 md:-translate-x-1/2
              bottom-0 md:bottom-4 px-4 md:px-0">
        <div className="bg-white border border-gray-200 rounded-t-2xl md:rounded-2xl
            shadow-xl p-4 md:p-4 flex flex-col sm:flex-row items-stretch
            sm:items-center gap-3 max-w-full md:max-w-sm mx-auto">
          {/* App icon */}
          <div className="w-12 h-12 bg-black rounded-xl flex items-center
                          justify-center shrink-0">
            <span className="text-white text-sm font-bold">PL</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Install PayLaw
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {isIOS
                ? 'Add to your home screen'
                : 'Install for quick access — works offline'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShow(false)}
              className="text-xs text-gray-400 hover:text-gray-600
                         px-2 py-2 rounded-lg border border-gray-100
                         w-full sm:w-auto"
            >
              Later
            </button>
            <button
              onClick={handleInstall}
              className="bg-black text-white text-xs font-semibold
                         px-3 py-2 rounded-lg hover:bg-gray-800
                         transition-colors w-full sm:w-auto"
            >
              {isIOS ? 'How?' : 'Install'}
            </button>
          </div>
        </div>
      </div>

      {/* iOS guide modal */}
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
              Install PayLaw on your iPhone
            </h3>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-gray-100 rounded-full flex
                                 items-center justify-center text-sm
                                 font-bold text-gray-700 shrink-0">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Tap the Share button
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    At the bottom of Safari — the box with an arrow
                    pointing up
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-gray-100 rounded-full flex
                                 items-center justify-center text-sm
                                 font-bold text-gray-700 shrink-0">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Scroll down and tap
                    <strong> Add to Home Screen</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    It has a plus icon next to it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-black rounded-full flex
                                 items-center justify-center text-sm
                                 font-bold text-white shrink-0">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Tap <strong>Add</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    PayLaw will appear on your home screen like a
                    real app
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-5 bg-black text-white text-sm
                         font-medium py-3 rounded-xl hover:bg-gray-800
                         transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}