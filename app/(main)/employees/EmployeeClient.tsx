'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// This is the shape of one employee from the database
interface Employee {
  id: string
  name: string
  jobTitle: string
  site: string
  dayRate: number
  otRate: number
  active: boolean
}

interface Props {
  employees: Employee[]
}

// Avatar background colours — cycles through these
const avColours = [
  'bg-green-100 text-green-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-red-100 text-red-800',
]

export default function EmployeeClient({ employees }: Props) {
  const router = useRouter()

  // Search and filter state
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'active' | 'inactive'>('all')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Employee | null>(null)

  // Form fields
  const [name, setName]         = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [site, setSite]         = useState('')
  const [dayRate, setDayRate]   = useState('')
  const [otRate, setOtRate]     = useState('')

  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  // ── Filter employees based on search + tab ──────────
  const filtered = employees.filter(e => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'active' && e.active) ||
      (filter === 'inactive' && !e.active)
    return matchSearch && matchFilter
  })

  const activeCount   = employees.filter(e => e.active).length
  const inactiveCount = employees.filter(e => !e.active).length

  // ── Open modal for adding ────────────────────────────
  function openAdd() {
    setEditing(null)
    setName(''); setJobTitle(''); setSite('')
    setDayRate(''); setOtRate(''); setError('')
    setShowModal(true)
  }

  // ── Open modal for editing ───────────────────────────
  function openEdit(emp: Employee) {
    setEditing(emp)
    setName(emp.name)
    setJobTitle(emp.jobTitle)
    setSite(emp.site)
    setDayRate(String(emp.dayRate))
    setOtRate(String(emp.otRate))
    setError('')
    setShowModal(true)
  }

  // ── Save (create or update) ──────────────────────────
  async function handleSave() {
    if (!name || !jobTitle || !site || !dayRate || !otRate) {
      setError('All fields are required')
      return
    }
    setSaving(true)
    setError('')

    try {
      if (editing) {
        // Update existing employee
        await fetch(`/api/employees/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, jobTitle, site, dayRate, otRate, active: editing.active }),
        })
      } else {
        // Create new employee
        await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, jobTitle, site, dayRate, otRate }),
        })
      }
      setShowModal(false)
      // Refresh the page to show new data
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Remove this employee? This cannot be undone.')) return

    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  // ── Get initials from name ───────────────────────────
  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
               width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="8.7" y1="8.7" x2="11.5" y2="11.5" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or job…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200
                       rounded-lg outline-none focus:border-gray-400 bg-white"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${filter === f
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'all' && `All (${employees.length})`}
              {f === 'active' && `Active (${activeCount})`}
              {f === 'inactive' && `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={openAdd}
          className="ml-auto flex items-center gap-2 bg-black text-white
                     text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800
                     transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Add employee
        </button>
      </div>

      {/* ── Employee grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp, i) => (
          <div
            key={emp.id}
            className={`bg-white border border-gray-100 rounded-xl p-5
                        transition-colors hover:border-gray-200
                        ${!emp.active ? 'opacity-60' : ''}`}
          >
            {/* Avatar + name */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center
                             text-sm font-semibold mb-3 ${avColours[i % avColours.length]}`}>
              {initials(emp.name)}
            </div>
            <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
            <p className="text-xs text-gray-500">{emp.jobTitle}</p>

            {/* Site */}
            <div className="flex items-center gap-1.5 mt-1 mb-4">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="4" r="2" stroke="#9CA3AF" strokeWidth="1"/>
                <path d="M1.5 8.5C1.5 6.567 3.067 5 5 5s3.5 1.567 3.5 3.5"
                      stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <span className="text-xs text-gray-400">{emp.site}</span>
            </div>

            {/* Rates */}
            <div className="flex gap-2 mb-4">
              <span className="text-xs font-medium bg-green-50 text-green-700
                               border border-green-100 px-2 py-0.5 rounded">
                K {emp.dayRate} / day
              </span>
              <span className="text-xs font-medium bg-amber-50 text-amber-700
                               border border-amber-100 px-2 py-0.5 rounded">
                K {emp.otRate} / hr OT
              </span>
            </div>

            <div className="border-t border-gray-100 pt-3 flex items-center
                            justify-between">
              {/* Status badge */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                flex items-center gap-1
                ${emp.active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-100 text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full
                  ${emp.active ? 'bg-green-500' : 'bg-gray-400'}`}/>
                {emp.active ? 'Active' : 'Inactive'}
              </span>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(emp)}
                  className="text-xs border border-gray-200 px-3 py-1 rounded-lg
                             text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="text-xs border border-red-100 px-3 py-1 rounded-lg
                             text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Del
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add card */}
        <button
          onClick={openAdd}
          className="border border-dashed border-gray-200 rounded-xl p-5
                     flex flex-col items-center justify-center gap-2 min-h-48
                     text-gray-400 hover:border-gray-400 hover:text-gray-600
                     hover:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full border border-gray-200 flex
                          items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm">Add employee</span>
        </button>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center
                     justify-center p-4 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {editing ? 'Edit employee' : 'Add employee'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Rates will auto-fill when added to a paylaw or OT sheet
            </p>

            <div className="flex flex-col gap-3">

              {/* Full name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Full name
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                             outline-none focus:border-gray-400"
                  placeholder="e.g. John Banda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {/* Job title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Job title
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                             outline-none focus:border-gray-400"
                  placeholder="e.g. Carpenter"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </div>

              {/* Site */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Site
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                             outline-none focus:border-gray-400"
                  placeholder="e.g. Lusaka Central"
                  value={site}
                  onChange={e => setSite(e.target.value)}
                />
              </div>

              {/* Rates side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Day rate (K)
                  </label>
                  <input
                    type="number"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                               outline-none focus:border-gray-400"
                    placeholder="e.g. 90"
                    value={dayRate}
                    onChange={e => setDayRate(e.target.value)}
                  />
                  <span className="text-xs text-gray-400">Normal shift · per day</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    OT rate (K)
                  </label>
                  <input
                    type="number"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                               outline-none focus:border-gray-400"
                    placeholder="e.g. 30"
                    value={otRate}
                    onChange={e => setOtRate(e.target.value)}
                  />
                  <span className="text-xs text-gray-400">Overtime · per hour</span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100
                              rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                           text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg
                           hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}