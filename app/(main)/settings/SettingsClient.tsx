'use client'

import { useState } from 'react'

interface Settings {
  companyName: string
  siteName: string
  phone: string
  email: string
  address: string
}

interface Props {
  initial: Settings
}

export default function SettingsClient({ initial }: Props) {
  const [form, setForm]     = useState<Settings>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')

  function update(key: keyof Settings, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        setError('Failed to save. Please try again.')
        return
      }

      setSaved(true)
    } catch {
      setError('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-2xl">

      {/* Company info */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase
                      tracking-wider mb-4 flex items-center gap-3
                      after:flex-1 after:h-px after:bg-gray-100
                      after:content-['']">
          Company info
        </p>
        <p className="text-xs text-gray-400 mb-5">
          This information will appear at the top of every PDF you generate.
        </p>

        <div className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Company name
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400"
              placeholder="e.g. Mwansa Construction Ltd"
              value={form.companyName}
              onChange={e => update('companyName', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Default site name
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400"
              placeholder="e.g. Lusaka Central"
              value={form.siteName}
              onChange={e => update('siteName', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500
                                 uppercase tracking-wide">
                Phone number
              </label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2
                           text-sm outline-none focus:border-gray-400"
                placeholder="e.g. +260 97 123 4567"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500
                                 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                className="border border-gray-200 rounded-lg px-3 py-2
                           text-sm outline-none focus:border-gray-400"
                placeholder="e.g. info@company.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Address
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400"
              placeholder="e.g. Cairo Road, Lusaka, Zambia"
              value={form.address}
              onChange={e => update('address', e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* PDF preview */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase
                      tracking-wider mb-4 flex items-center gap-3
                      after:flex-1 after:h-px after:bg-gray-100
                      after:content-['']">
          PDF header preview
        </p>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50
                        font-mono">
          <div className="text-center border-b border-gray-300 pb-3 mb-3">
            {form.companyName ? (
              <p className="text-base font-bold text-gray-900 tracking-wide">
                {form.companyName}
              </p>
            ) : (
              <p className="text-base font-bold text-gray-300">
                Your company name
              </p>
            )}
            <p className="text-lg font-black text-gray-900 tracking-widest
                          mt-1">
              PAYLAW
            </p>
            <div className="flex justify-center gap-4 mt-2 text-xs
                            text-gray-500 flex-wrap">
              {form.phone && <span>📞 {form.phone}</span>}
              {form.email && <span>✉ {form.email}</span>}
              {form.address && <span>📍 {form.address}</span>}
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center">
            Site: {form.siteName || 'Site name'} &nbsp;·&nbsp;
            Period: Month Year
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white text-sm font-medium px-6 py-2.5
                     rounded-lg hover:bg-gray-800 transition-colors
                     disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>

        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" fill="#16a34a"/>
              <path d="M4 7l2.5 2.5L10 4.5" stroke="white"
                    strokeWidth="1.5" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
            Settings saved
          </span>
        )}

        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>

    </div>
  )
}