'use client'

import { useState, useEffect } from 'react'

// The browser fires a 'beforeinstallprompt' event
// when the app is installable. We capture it and
// show our own button instead of the browser default.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow]         = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed — if running as standalone
    // then the user already installed it so don't show the prompt
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Listen for the browser's install prompt event
    const handler = (e: Event) => {
      e.preventDefault() // stop the browser showing its own prompt
      setInstallEvent(e as BeforeInstallPromptEvent)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installEvent) return
    await installEvent.prompt()
    const result = await installEvent.userChoice
    if (result.outcome === 'accepted') {
      setShow(false)
      setInstalled(true)
    }
  }

  // Don't show anything if already installed or not installable
  if (!show || installed) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50
                    bg-white border border-gray-200 rounded-2xl shadow-xl
                    p-4 flex items-center gap-4 max-w-sm w-full mx-4">

      {/* App icon */}
      <div className="w-12 h-12 bg-black rounded-xl flex items-center
                      justify-center flex-shrink-0">
        <span className="text-white text-sm font-bold tracking-wider">PL</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Install PayLaw</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Add to your home screen for quick access
        </p>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setShow(false)}
          className="text-xs text-gray-400 hover:text-gray-600
                     px-2 py-1 transition-colors"
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          className="bg-black text-white text-xs font-medium
                     px-3 py-1.5 rounded-lg hover:bg-gray-800
                     transition-colors"
        >
          Install
        </button>
      </div>
    </div>
  )
}