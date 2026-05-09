'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Foreman {
  id: string
  name: string | null
  email: string
  site: string | null
  createdAt: Date
}

interface Props {
  foremen: Foreman[]
}

export default function TeamClient({ foremen }: Props) {
  const router = useRouter()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [site, setSite]       = useState('')

  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  function openAdd() {
    setEditingId(null)
    setName(''); setEmail(''); setPassword(''); setSite('')
    setError('')
    setShowModal(true)
  }

  function openEdit(f: Foreman) {
    setEditingId(f.id)
    setName(f.name || '')
    setEmail(f.email)
    setPassword('')
    setSite(f.site || '')
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!name || !site) {
      setError('Name and site are required')
      return
    }
    if (!editingId && (!email || !password)) {
      setError('Email and password are required for new accounts')
      return
    }

    setSaving(true)
    setError('')

    try {
      if (editingId) {
        // Update existing foreman
        const res = await fetch(`/api/team/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, site,
            password: password || undefined,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Failed to update')
          return
        }
      } else {
        // Create new foreman
        const res = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, site }),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Failed to create')
          return
        }
      }

      setShowModal(false)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(
      `Remove ${name} from your team?\n\nThey will no longer be able to log in.`
    )) return

    await fetch(`/api/team/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  // Avatar colours
  const colours = [
    'bg-green-100 text-green-800',
    'bg-blue-100 text-blue-800',
    'bg-amber-100 text-amber-800',
    'bg-purple-100 text-purple-800',
  ]

  function initials(name: string | null) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-3xl">

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl
                      p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">How foreman accounts work</p>
        <ul className="text-xs text-blue-600 flex flex-col gap-1 list-disc
                       list-inside">
          <li>Each foreman logs in with their own email and password</li>
          <li>They can only see and mark paylaws for their assigned site</li>
          <li>They cannot access employees, summary, settings, or other sites</li>
          <li>You see everything they do on your dashboard</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {foremen.length} foreman{foremen.length !== 1 ? 'en' : ''} on your team
        </p>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-black text-white text-sm
                     font-medium px-4 py-2 rounded-lg hover:bg-gray-800
                     transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Add foreman
        </button>
      </div>

      {/* Foreman cards */}
      {foremen.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200
                        rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400 mb-1">No foremen yet</p>
          <p className="text-xs text-gray-300">
            Add a foreman to let them mark attendance for their site
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {foremen.map((f, i) => (
            <div
              key={f.id}
              className="bg-white border border-gray-100 rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center
                                   justify-center text-sm font-semibold
                                   flex-shrink-0
                                   ${colours[i % colours.length]}`}>
                    {initials(f.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {f.name}
                    </p>
                    <p className="text-xs text-gray-400">{f.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-green-50 text-green-700
                                 border border-green-100 px-2 py-0.5
                                 rounded-full font-medium">
                  Foreman
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-4">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="5" r="2.5" stroke="#9CA3AF"
                          strokeWidth="1.1"/>
                  <path d="M1.5 10.5C1.5 8.015 3.515 6 6 6s4.5 2.015 4.5 4.5"
                        stroke="#9CA3AF" strokeWidth="1.1"
                        strokeLinecap="round"/>
                </svg>
                <span className="text-xs text-gray-500 font-medium">
                  Assigned to: <strong>{f.site}</strong>
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(f)}
                  className="flex-1 text-xs border border-gray-200 py-1.5
                             rounded-lg text-gray-600 hover:bg-gray-50
                             transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemove(f.id, f.name || f.email)}
                  className="flex-1 text-xs border border-red-100 py-1.5
                             rounded-lg text-red-600 bg-red-50
                             hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center
                     justify-center p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md
                          shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {editingId ? 'Edit foreman' : 'Add foreman'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              {editingId
                ? 'Update their details. Leave password blank to keep current.'
                : 'They will log in with these credentials.'}
            </p>

            <div className="flex flex-col gap-3">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500
                                   uppercase tracking-wide">
                  Full name
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2
                             text-sm outline-none focus:border-gray-400"
                  placeholder="e.g. James Tembo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {!editingId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-500
                                     uppercase tracking-wide">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="border border-gray-200 rounded-lg px-3 py-2
                               text-sm outline-none focus:border-gray-400"
                    placeholder="james@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500
                                   uppercase tracking-wide">
                  Password {editingId && (
                    <span className="text-gray-300 font-normal normal-case
                                     tracking-normal">
                      — leave blank to keep current
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  className="border border-gray-200 rounded-lg px-3 py-2
                             text-sm outline-none focus:border-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500
                                   uppercase tracking-wide">
                  Assigned site
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2
                             text-sm outline-none focus:border-gray-400"
                  placeholder="e.g. Lusaka Central"
                  value={site}
                  onChange={e => setSite(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  They will only see paylaws for this site
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border
                              border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-4
                            border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-200
                           rounded-lg text-gray-600 hover:bg-gray-50
                           transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-black text-white
                           rounded-lg hover:bg-gray-800 transition-colors
                           disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId ? 'Save changes' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}