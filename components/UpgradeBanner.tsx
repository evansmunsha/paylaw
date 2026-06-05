'use client'

import { useRouter } from 'next/navigation'

interface Props {
  title:    string
  message:  string
  feature?: string  // what feature is locked
  compact?: boolean // small inline version
}

export default function UpgradeBanner({
  title,
  message,
  feature,
  compact = false,
}: Props) {
  const router = useRouter()

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-amber-50 border
                      border-amber-200 rounded-xl px-4 py-3 flex-wrap">
        <span className="text-base flex-shrink-0">🔒</span>
        <p className="text-sm text-amber-800 flex-1 min-w-0">
          <strong>{title}</strong> — {message}
        </p>
        <button
          onClick={() => router.push('/billing')}
          className="flex-shrink-0 text-xs bg-amber-600 text-white
                     font-semibold px-3 py-1.5 rounded-lg
                     hover:bg-amber-700 transition-colors"
        >
          Upgrade →
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border
                    border-amber-200 rounded-2xl p-6 flex flex-col
                    items-center text-center gap-4">

      {/* Lock icon */}
      <div className="w-14 h-14 bg-amber-100 border border-amber-200
                      rounded-2xl flex items-center justify-center text-2xl">
        🔒
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
          {message}
        </p>
      </div>

      {/* What you get */}
      {feature && (
        <div className="bg-white border border-amber-100 rounded-xl
                        px-4 py-3 text-sm text-gray-600 w-full max-w-sm">
          <p className="text-xs font-semibold text-amber-600 uppercase
                         tracking-wide mb-2">
            Unlock with Starter — $9/month
          </p>
          <p>{feature}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/billing')}
          className="bg-black text-white text-sm font-semibold px-6
                     py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
        >
          Upgrade now →
        </button>
        <button
          onClick={() => router.push('/billing')}
          className="border border-gray-200 text-gray-600 text-sm
                     px-6 py-2.5 rounded-xl hover:bg-gray-50
                     transition-colors"
        >
          See pricing
        </button>
      </div>
    </div>
  )
}