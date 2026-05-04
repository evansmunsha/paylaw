'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Employee {
  id: string
  name: string
  jobTitle: string
  site: string
  dayRate: number
  otRate: number
}

interface WorkerRow {
  employeeId: string
  name: string
  jobTitle: string
  otRate: number
  // hours per day e.g. { "1": 2, "2": 0, "3": 3 }
  hours: Record<string, number>
  signature: string
}

interface Props {
  employees: Employee[]
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function NewOvertimeClient({ employees }: Props) {
  const router = useRouter()

  const now = new Date()
  const [site, setSite]             = useState('')
  const [month, setMonth]           = useState(now.getMonth() + 1)
  const [year, setYear]             = useState(now.getFullYear())
  const [preparedBy, setPreparedBy] = useState('')
  const [rows, setRows]             = useState<WorkerRow[]>([])
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const daysInMonth = useMemo(
    () => new Date(year, month, 0).getDate(),
    [month, year]
  )

  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getDayOfWeek(day: number) {
    return new Date(year, month - 1, day).getDay()
  }

  function isWeekend(day: number) {
    const dow = getDayOfWeek(day)
    return dow === 0 || dow === 6
  }

  function addWorker() {
    if (!selectedEmpId) return
    if (rows.find(r => r.employeeId === selectedEmpId)) {
      setError('This worker is already in the list')
      return
    }
    const emp = employees.find(e => e.id === selectedEmpId)
    if (!emp) return
    setError('')
    setRows(prev => [...prev, {
      employeeId: emp.id,
      name: emp.name,
      jobTitle: emp.jobTitle,
      otRate: emp.otRate,
      hours: {},
      signature: '',
    }])
    setSelectedEmpId('')
  }

  function removeWorker(employeeId: string) {
    setRows(prev => prev.filter(r => r.employeeId !== employeeId))
  }

  // Update hours for a specific day for one worker
  function updateHours(employeeId: string, day: number, value: string) {
    const hrs = parseFloat(value) || 0
    setRows(prev => prev.map(row => {
      if (row.employeeId !== employeeId) return row
      return {
        ...row,
        hours: {
          ...row.hours,
          [String(day)]: hrs,
        },
      }
    }))
  }

  function updateRate(employeeId: string, rate: string) {
    setRows(prev => prev.map(row =>
      row.employeeId === employeeId
        ? { ...row, otRate: parseFloat(rate) || 0 }
        : row
    ))
  }

  // Total hours worked for one worker across the month
  function totalHours(row: WorkerRow) {
    return Object.values(row.hours).reduce((t, h) => t + h, 0)
  }

  // OT amount for one worker
  function rowAmount(row: WorkerRow) {
    return totalHours(row) * row.otRate
  }

  const grandHours  = rows.reduce((t, r) => t + totalHours(r), 0)
  const grandAmount = rows.reduce((t, r) => t + rowAmount(r), 0)

  async function handleSave(status: 'draft' | 'done') {
    if (!site || !preparedBy) {
      setError('Site name and Prepared by are required')
      return
    }
    if (rows.length === 0) {
      setError('Add at least one worker')
      return
    }
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site, month, year, preparedBy, status,
          rows: rows.map(row => ({
            employeeId: row.employeeId,
            otRate: row.otRate,
            totalHours: totalHours(row),
            amount: rowAmount(row),
            hours: row.hours,
            signature: row.signature,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      router.push('/overtime')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const availableEmployees = employees.filter(
    e => !rows.find(r => r.employeeId === e.id)
  )

  return (
    <div className="p-6 flex flex-col gap-5">

      {/* Formula strip — amber for OT */}
      <div className="inline-flex items-center gap-2 bg-amber-50 border
                      border-amber-100 rounded-lg px-4 py-2 text-sm
                      text-gray-600 flex-wrap">
        <span className="text-gray-400">Formula:</span>
        <span className="font-medium text-gray-800">OT salary</span>
        <span className="text-gray-400">=</span>
        <span className="bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded">
          total OT hours
        </span>
        <span className="text-gray-400">×</span>
        <span className="bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded">
          rate per hour (K)
        </span>
      </div>

      {/* Sheet Info */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                      mb-4 flex items-center gap-3 after:flex-1 after:h-px
                      after:bg-gray-100 after:content-['']">
          Sheet info
        </p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Site name
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                         outline-none focus:border-gray-400"
              placeholder="e.g. Lusaka Central"
              value={site}
              onChange={e => setSite(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Month
            </label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                         outline-none focus:border-gray-400 bg-white"
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Year
            </label>
            <input
              type="number"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                         outline-none focus:border-gray-400"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Prepared by
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                         outline-none focus:border-gray-400"
              placeholder="Your name"
              value={preparedBy}
              onChange={e => setPreparedBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* OT Hours Grid */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider
                      mb-1 flex items-center gap-3 after:flex-1 after:h-px
                      after:bg-gray-100 after:content-['']">
          Overtime hours per day
        </p>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-5 rounded bg-amber-50 border border-amber-300
                               flex items-center justify-center text-amber-700
                               font-bold text-xs">2</span>
              Hours worked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-amber-50/40
                               border border-amber-100"/>
              Weekend
            </span>
            <span className="text-gray-400">· Type hours in each day cell</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs
                        text-gray-400 mb-2 px-1">
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Scroll to see all days
          </span>
          <span className="flex items-center gap-1">
            Scroll to see all days
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {/* Add worker */}
        <div className="flex gap-2 mb-4">
          <select
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2
                       text-sm outline-none focus:border-gray-400 bg-white"
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
          >
            <option value="">Select a worker to add...</option>
            {availableEmployees.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.jobTitle} (K {e.otRate}/hr OT)
              </option>
            ))}
          </select>
          <button
            onClick={addWorker}
            disabled={!selectedEmpId}
            className="flex items-center gap-2 bg-black text-white text-sm
                       font-medium px-4 py-2 rounded-lg hover:bg-gray-800
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Add worker
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl
                          py-12 text-center text-sm text-gray-400">
            No workers added yet. Select a worker above and click Add worker.
          </div>
        ) : (
          <div
            className="border border-gray-200 rounded-xl overflow-x-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#FCD34D #FEF3C7',
            }}
          >
            <table style={{
              minWidth: 'max-content',
              borderCollapse: 'separate',
              borderSpacing: 0
            }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b border-r
                                 border-gray-200 text-left text-xs font-medium
                                 text-gray-400 uppercase tracking-wide px-4 py-3
                                 min-w-36">
                    Name
                  </th>
                  <th className="sticky left-36 z-20 bg-gray-50 border-b border-r
                                 border-gray-200 text-left text-xs font-medium
                                 text-gray-400 uppercase tracking-wide px-3 py-3
                                 min-w-28">
                    Job title
                  </th>
                  <th className="sticky left-64 z-20 bg-gray-50 border-b border-r
                                 border-gray-200 text-center text-xs font-medium
                                 text-gray-400 uppercase tracking-wide px-3 py-3
                                 min-w-20">
                    K / hr
                  </th>

                  {allDays.map(day => {
                    const dow = getDayOfWeek(day)
                    const weekend = isWeekend(day)
                    return (
                      <th key={day}
                          className={`border-b border-gray-200 text-center
                                      px-0 py-2 min-w-10
                                      ${weekend ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-semibold
                            ${weekend ? 'text-amber-600' : 'text-gray-600'}`}>
                            {day}
                          </span>
                          <span className={`text-xs
                            ${weekend ? 'text-amber-400' : 'text-gray-300'}`}>
                            {DAY_LABELS[dow]}
                          </span>
                        </div>
                      </th>
                    )
                  })}

                  <th className="border-b border-l border-gray-200 bg-gray-50
                                 text-center text-xs font-medium text-gray-400
                                 uppercase tracking-wide px-3 py-3 min-w-16">
                    Total hrs
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50 text-right
                                 text-xs font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-24">
                    Amount
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50 text-left
                                 text-xs font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-24">
                    Signature
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50
                                 px-2 py-3 min-w-10"/>
                </tr>
              </thead>

              <tbody>
                {rows.map(row => {
                  const hrs = totalHours(row)
                  const amt = rowAmount(row)
                  return (
                    <tr key={row.employeeId}
                        className="border-b border-gray-100 hover:bg-gray-50/50">

                      <td className="sticky left-0 z-10 bg-white border-r
                                     border-gray-100 px-4 py-2.5 text-sm
                                     font-medium text-gray-900 min-w-36">
                        {row.name}
                      </td>

                      <td className="sticky left-36 z-10 bg-white border-r
                                     border-gray-100 px-3 py-2.5 text-xs
                                     text-gray-500 min-w-28">
                        {row.jobTitle}
                      </td>

                      <td className="sticky left-64 z-10 bg-white border-r
                                     border-gray-200 px-2 py-2.5 min-w-20">
                        <input
                          type="number"
                          value={row.otRate}
                          onChange={e => updateRate(row.employeeId, e.target.value)}
                          className="w-16 text-center text-xs font-semibold
                                     text-amber-700 bg-amber-50 border
                                     border-amber-200 rounded px-1 py-1
                                     outline-none focus:border-amber-400"
                        />
                      </td>

                      {allDays.map(day => {
                        const weekend = isWeekend(day)
                        const val = row.hours[String(day)] || 0
                        return (
                          <td key={day}
                              className={`px-0.5 py-2 text-center
                                ${weekend ? 'bg-amber-50/40' : ''}`}>
                            <input
                              type="number"
                              min="0"
                              max="24"
                              value={val || ''}
                              placeholder="0"
                              onChange={e => updateHours(row.employeeId, day, e.target.value)}
                              className={`w-9 h-7 rounded text-xs font-bold
                                          text-center border outline-none
                                          transition-all block mx-auto
                                          [appearance:textfield]
                                          [&::-webkit-inner-spin-button]:appearance-none
                                ${val > 0
                                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                                  : weekend
                                  ? 'bg-amber-50/40 border-amber-100 text-gray-300'
                                  : 'bg-gray-50 border-gray-200 text-gray-300'
                                }
                                focus:border-amber-400 focus:bg-amber-50`}
                            />
                          </td>
                        )
                      })}

                      <td className="border-l border-gray-100 px-3 py-2.5
                                     text-center text-sm font-semibold text-amber-700">
                        {hrs > 0 ? `${hrs}h` : '—'}
                      </td>

                      <td className="px-3 py-2.5 text-right text-sm font-semibold
                                     text-amber-700 whitespace-nowrap">
                        {amt > 0 ? `K ${amt.toLocaleString()}` : '—'}
                      </td>

                      <td className="px-2 py-2.5">
                        <input
                          type="text"
                          placeholder="sign…"
                          value={row.signature}
                          onChange={e => {
                            const sig = e.target.value
                            setRows(prev => prev.map(r =>
                              r.employeeId === row.employeeId
                                ? { ...r, signature: sig }
                                : r
                            ))
                          }}
                          className="w-20 border-b border-gray-200 text-xs
                                     text-gray-600 italic outline-none px-1
                                     bg-transparent focus:border-gray-400
                                     placeholder:text-gray-300"
                        />
                      </td>

                      <td className="px-2 py-2.5">
                        <button
                          onClick={() => removeWorker(row.employeeId)}
                          className="w-6 h-6 flex items-center justify-center
                                     rounded bg-red-50 border border-red-100
                                     text-red-500 hover:bg-red-500
                                     hover:text-white text-sm font-bold
                                     transition-colors"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {/* Daily hours total row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={3}
                      className="sticky left-0 z-10 bg-gray-50 px-4 py-2
                                 text-xs font-semibold text-gray-500">
                    Daily hrs total
                  </td>
                  {allDays.map(day => {
                    const total = rows.reduce(
                      (t, r) => t + (r.hours[String(day)] || 0), 0
                    )
                    return (
                      <td key={day} className="text-center px-0.5 py-2">
                        <span className={`text-xs font-semibold
                          ${total > 0 ? 'text-amber-700' : 'text-gray-300'}`}>
                          {total > 0 ? `${total}h` : '—'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="border-l border-gray-200 px-3 py-2 text-center
                                 text-xs font-bold text-amber-700">
                    {grandHours}h
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold
                                 text-amber-700 whitespace-nowrap">
                    K {grandAmount.toLocaleString()}
                  </td>
                  <td colSpan={2}/>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="bg-white border border-gray-100 rounded-xl p-5
                      flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Workers</p>
            <p className="text-xl font-semibold text-gray-900">{rows.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total OT hours
            </p>
            <p className="text-xl font-semibold text-amber-700">{grandHours}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total OT pay
            </p>
            <p className="text-xl font-semibold text-amber-700">
              K {grandAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100
                          rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                       text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg
                       text-gray-700 hover:bg-gray-50 transition-colors
                       disabled:opacity-50"
          >
            Save draft
          </button>
          <button
            onClick={() => handleSave('done')}
            disabled={saving}
            className="px-4 py-2 text-sm bg-black text-white rounded-lg
                       hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & generate PDF ↗'}
          </button>
        </div>
      </div>

    </div>
  )
}