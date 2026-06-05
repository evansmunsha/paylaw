'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UpgradeBanner from '@/components/UpgradeBanner'
import { getCurrencySymbol } from '@/lib/currency'

interface Employee {
  id: string
  name: string
  jobTitle: string
  site: string
  dayRate: number
  otRate: number
  active: boolean
}

interface ForemanSite {
  site: string
  name: string | null
}

interface Props {
  employees: Employee[]
  allSites: string[]
  foremanSites: ForemanSite[]
  currency: string
  plan: string
  workerLimit: number
}

const avColours = [
  'bg-green-100 text-green-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-red-100 text-red-800',
]

export default function EmployeeClient({
  employees,
  allSites,
  foremanSites,
  currency,
  plan,
  workerLimit,
}: Props) {
  const router = useRouter()
  const { data: session } = useSession()

  const isForeman   = session?.user?.role === 'foreman'
  const foremanSite = session?.user?.site || ''

  const symbol = getCurrencySymbol(currency)

  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<'all' | 'active' | 'inactive'>('all')
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Employee | null>(null)

  const [name, setName]         = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [site, setSite]         = useState('')
  const [dayRate, setDayRate]   = useState('')
  const [otRate, setOtRate]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const showWorkerLimitBanner =
    workerLimit !== -1 && employees.length >= workerLimit
  const canAddEmployee = !showWorkerLimitBanner

  const filtered = employees.filter(e => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.jobTitle.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ||
      (filter === 'active'   && e.active) ||
      (filter === 'inactive' && !e.active)
    return matchSearch && matchFilter
  })

  const activeCount   = employees.filter(e => e.active).length
  const inactiveCount = employees.filter(e => !e.active).length

  function openAdd() {
    if (!canAddEmployee) {
      setError(`You have reached your ${plan} plan limit of ${workerLimit} workers. Upgrade to Pro for unlimited employees.`)
      return
    }

    setEditing(null)
    setName('')
    setJobTitle('')
    setSite(isForeman ? foremanSite : (allSites[0] || ''))
    setDayRate('')
    setOtRate('')
    setError('')
    setShowModal(true)
  }

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

  async function handleSave() {
    if (!name || !jobTitle || !site || !dayRate || !otRate) {
      setError('All fields are required')
      return
    }
    setSaving(true)
    setError('')

    try {
      if (editing) {
        const res = await fetch(`/api/employees/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, jobTitle, site, dayRate, otRate,
            active: editing.active,
          }),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || 'Failed to update')
          return
        }
      } else {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, jobTitle, site, dayRate, otRate }),
        })
        if (!res.ok) {
          const d = await res.json()
          if (d.code === 'PLAN_LIMIT') {
            setError(`${d.error} ${d.upgrade || ''}`.trim())
            return
          }
          setError(d.error || 'Failed to create')
          return
        }
      }
      setShowModal(false)
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReassign(empId: string, newSite: string) {
    await fetch(`/api/employees/${empId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: newSite }),
    })
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this employee? This cannot be undone.')) return
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Foreman site banner */}
      {isForeman && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl
                        px-4 py-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="5" r="2.5" stroke="#3b82f6"
                    strokeWidth="1.2"/>
            <path d="M2 12c0-2.761 2.239-4 5-4s5 1.239 5 4"
                  stroke="#3b82f6" strokeWidth="1.2"
                  strokeLinecap="round"/>
          </svg>
          <p className="text-sm text-blue-700">
            Showing workers for your site:
            <strong className="ml-1">{foremanSite}</strong>
          </p>
        </div>
      )}

      {/* Toolbar */}
      {showWorkerLimitBanner && (
        <UpgradeBanner
          title="Employee limit reached"
          message={`Your ${plan} plan supports up to ${workerLimit} workers. Upgrade to Pro to add unlimited employees.`}
          feature="Unlimited workers on Pro"
          compact
        />
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2
                          text-gray-400"
               width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor"
                    strokeWidth="1.3"/>
            <line x1="8.7" y1="8.7" x2="11.5" y2="11.5"
                  stroke="currentColor" strokeWidth="1.3"
                  strokeLinecap="round"/>
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

        <div className="flex gap-1 bg-white border border-gray-200
                        rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium
                          transition-colors
                ${filter === f
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {f === 'all'      && `All (${employees.length})`}
              {f === 'active'   && `Active (${activeCount})`}
              {f === 'inactive' && `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>

        <button
          onClick={openAdd}
          disabled={!canAddEmployee}
          className={`ml-auto flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg shrink-0 transition-colors
                     ${canAddEmployee
                       ? 'bg-black text-white hover:bg-gray-800'
                       : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor"
                  strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Add employee
        </button>
      </div>

      {/* Employee grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl
                        py-16 text-center">
          <p className="text-sm text-gray-400">
            {search
              ? `No employees match "${search}"`
              : isForeman
              ? `No workers at ${foremanSite} yet`
              : 'No employees yet'}
          </p>
          <button
            onClick={openAdd}
            className="mt-3 text-sm underline text-gray-400
                       hover:text-gray-700"
          >
            Add employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3
                        gap-4">
          {filtered.map((emp, i) => (
            <div
              key={emp.id}
              className={`bg-white border border-gray-100 rounded-xl p-5
                          transition-colors hover:border-gray-200
                          ${!emp.active ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center
                               justify-center text-sm font-semibold mb-3
                               shrink-0
                               ${avColours[i % avColours.length]}`}>
                {initials(emp.name)}
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {emp.name}
              </p>
              <p className="text-xs text-gray-500 mb-1">{emp.jobTitle}</p>

              {/* Site */}
              {isForeman ? (
                <div className="flex items-center gap-1.5 mb-4">
                  <svg width="10" height="10" viewBox="0 0 10 10"
                       fill="none">
                    <circle cx="5" cy="4" r="2" stroke="#9CA3AF"
                            strokeWidth="1"/>
                    <path d="M1.5 8.5C1.5 6.567 3.067 5 5 5
                             s3.5 1.567 3.5 3.5"
                          stroke="#9CA3AF" strokeWidth="1"
                          strokeLinecap="round"/>
                  </svg>
                  <span className="text-xs text-gray-400">{emp.site}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mb-4">
                  <svg width="10" height="10" viewBox="0 0 10 10"
                       fill="none">
                    <circle cx="5" cy="4" r="2" stroke="#9CA3AF"
                            strokeWidth="1"/>
                    <path d="M1.5 8.5C1.5 6.567 3.067 5 5 5
                             s3.5 1.567 3.5 3.5"
                          stroke="#9CA3AF" strokeWidth="1"
                          strokeLinecap="round"/>
                  </svg>
                  <select
                    value={emp.site}
                    onChange={e => handleReassign(emp.id, e.target.value)}
                    className="text-xs text-gray-600 border-0 bg-transparent
                               outline-none cursor-pointer hover:text-gray-900"
                    title="Click to change site"
                  >
                    {allSites.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {!allSites.includes(emp.site) && (
                      <option value={emp.site}>{emp.site}</option>
                    )}
                  </select>
                  <svg width="8" height="8" viewBox="0 0 8 8"
                       fill="none" className="text-gray-300">
                    <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor"
                          strokeWidth="1.2" strokeLinecap="round"
                          strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Rates — using currency symbol */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="text-xs font-medium bg-green-50
                                 text-green-700 border border-green-100
                                 px-2 py-0.5 rounded">
                  {symbol} {emp.dayRate} / day
                </span>
                <span className="text-xs font-medium bg-amber-50
                                 text-amber-700 border border-amber-100
                                 px-2 py-0.5 rounded">
                  {symbol} {emp.otRate} / hr OT
                </span>
              </div>

              <div className="border-t border-gray-100 pt-3 flex
                              items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5
                                  rounded-full flex items-center gap-1
                  ${emp.active
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full
                    ${emp.active ? 'bg-green-500' : 'bg-gray-400'}`}/>
                  {emp.active ? 'Active' : 'Inactive'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(emp)}
                    className="text-xs border border-gray-200 px-3 py-1
                               rounded-lg text-gray-600 hover:bg-gray-50
                               transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="text-xs border border-red-100 px-3 py-1
                               rounded-lg text-red-600 bg-red-50
                               hover:bg-red-100 transition-colors"
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
            className="border border-dashed border-gray-200 rounded-xl
                       p-5 flex flex-col items-center justify-center
                       gap-2 min-h-48 text-gray-400
                       hover:border-gray-400 hover:text-gray-600
                       hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full border border-gray-200
                            flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor"
                      strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-sm">Add employee</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center
                     justify-center p-4 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md
                          shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {editing ? 'Edit employee' : 'Add employee'}
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Rates auto-fill when added to a paylaw or OT sheet
            </p>

            <div className="flex flex-col gap-3">

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600
                                   uppercase tracking-wide">
                  Full name
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2
                             text-sm outline-none focus:border-gray-400"
                  placeholder="e.g. John Banda"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600
                                   uppercase tracking-wide">
                  Job title
                </label>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2
                             text-sm outline-none focus:border-gray-400"
                  placeholder="e.g. Carpenter"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
              </div>

              {/* Site field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600
                                   uppercase tracking-wide">
                  Assign to site
                </label>
                {isForeman ? (
                  <div className="border border-gray-200 rounded-lg px-3
                                  py-2 text-sm bg-gray-50 text-gray-500
                                  flex items-center justify-between">
                    <span>{foremanSite}</span>
                    <span className="text-xs text-gray-300 bg-gray-100
                                     px-2 py-0.5 rounded">
                      Your site
                    </span>
                  </div>
                ) : allSites.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <select
                      value={allSites.includes(site) ? site : '__custom__'}
                      onChange={e => {
                        if (e.target.value !== '__custom__') {
                          setSite(e.target.value)
                        }
                      }}
                      className="border border-gray-200 rounded-lg px-3
                                 py-2 text-sm outline-none
                                 focus:border-gray-400 bg-white"
                    >
                      {allSites.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      <option value="__custom__">
                        + Type a different site...
                      </option>
                    </select>
                    {!allSites.includes(site) && (
                      <input
                        className="border border-gray-200 rounded-lg px-3
                                   py-2 text-sm outline-none
                                   focus:border-gray-400"
                        placeholder="Type site name..."
                        value={site}
                        onChange={e => setSite(e.target.value)}
                        autoFocus
                      />
                    )}
                    {foremanSites.find(f => f.site === site) && (
                      <p className="text-xs text-blue-600 bg-blue-50
                                    border border-blue-100 rounded-lg
                                    px-3 py-1.5">
                        Foreman:{' '}
                        <strong>
                          {foremanSites.find(f => f.site === site)?.name}
                        </strong>
                        {' '}manages this site
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    className="border border-gray-200 rounded-lg px-3
                               py-2 text-sm outline-none
                               focus:border-gray-400"
                    placeholder="e.g. Lusaka Central"
                    value={site}
                    onChange={e => setSite(e.target.value)}
                  />
                )}
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600
                                     uppercase tracking-wide">
                    Day rate ({symbol})
                  </label>
                  <input
                    type="number"
                    className="border border-gray-200 rounded-lg px-3
                               py-2 text-sm outline-none
                               focus:border-gray-400"
                    placeholder="e.g. 90"
                    value={dayRate}
                    onChange={e => setDayRate(e.target.value)}
                  />
                  <span className="text-xs text-gray-400">
                    Normal shift · per day
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-600
                                     uppercase tracking-wide">
                    OT rate ({symbol})
                  </label>
                  <input
                    type="number"
                    className="border border-gray-200 rounded-lg px-3
                               py-2 text-sm outline-none
                               focus:border-gray-400"
                    placeholder="e.g. 30"
                    value={otRate}
                    onChange={e => setOtRate(e.target.value)}
                  />
                  <span className="text-xs text-gray-400">
                    Overtime · per hour
                  </span>
                </div>
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
                  : editing ? 'Save changes' : 'Add employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}