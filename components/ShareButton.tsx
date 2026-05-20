'use client'

import { useEffect, useState } from 'react'

interface Props {
  url?:   string
  title?: string
  text?:  string
}

const fallbackSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://paylaw.vercel.app'

export default function ShareButton({
  url,
  title = 'PayLaw — Simple Payroll for Construction Teams',
  text  = 'Stop doing payroll on paper. PayLaw marks attendance, tracks overtime and generates PDF payslips in minutes. Free to start.',
}: Props) {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const shareUrl = url || currentUrl || fallbackSiteUrl

  // Use native share on mobile if available
  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl })
      } catch {
        // User cancelled — that is fine
      }
      return
    }
    // Fall back to our custom menu on desktop
    setShowMenu(prev => !prev)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    setShowMenu(false)
  }

  const encoded = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(`${text} ${shareUrl}`)

  const shareOptions = [
    {
      label: 'WhatsApp',
      icon:  '💬',
      href:  `https://wa.me/?text=${encodedText}`,
      color: 'hover:bg-green-50 hover:text-green-700',
    },
    {
      label: 'Facebook',
      icon:  '👥',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      color: 'hover:bg-blue-50 hover:text-blue-700',
    },
    {
      label: 'Twitter / X',
      icon:  '🐦',
      href:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encoded}`,
      color: 'hover:bg-sky-50 hover:text-sky-700',
    },
    {
      label: 'LinkedIn',
      icon:  '💼',
      href:  `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
      color: 'hover:bg-blue-50 hover:text-blue-800',
    },
  ]

  return (
    <div className="relative inline-block">
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 border border-gray-200
                   text-gray-700 text-sm font-medium px-5 py-3
                   rounded-xl hover:bg-gray-50 transition-colors
                   bg-white shadow-sm"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="12.5" cy="3" r="1.5" stroke="currentColor"
                  strokeWidth="1.3"/>
          <circle cx="12.5" cy="13" r="1.5" stroke="currentColor"
                  strokeWidth="1.3"/>
          <circle cx="3.5" cy="8" r="1.5" stroke="currentColor"
                  strokeWidth="1.3"/>
          <line x1="11.08" y1="3.84" x2="4.92" y2="7.16"
                stroke="currentColor" strokeWidth="1.3"
                strokeLinecap="round"/>
          <line x1="4.92" y1="8.84" x2="11.08" y2="12.16"
                stroke="currentColor" strokeWidth="1.3"
                strokeLinecap="round"/>
        </svg>
        Share PayLaw
      </button>

      {/* Desktop share menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-0 top-14 z-50 bg-white border
                          border-gray-200 rounded-2xl shadow-xl p-2 w-52">

            <p className="text-xs text-gray-400 font-medium px-3 py-2
                          uppercase tracking-wide">
              Share via
            </p>

            {shareOptions.map(opt => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowMenu(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 transition-colors ${opt.color}`}
              >
                <span className="text-base">{opt.icon}</span>
                {opt.label}
              </a>
            ))}

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={copyLink}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                           text-sm text-gray-700 hover:bg-gray-50
                           transition-colors w-full"
              >
                <span className="text-base">
                  {copied ? '✅' : '🔗'}
                </span>
                {copied ? 'Link copied!' : 'Copy link'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}