'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatMoney, getCurrencySymbol } from '@/lib/currency'

interface Employee {
  active: boolean
  id: string
  name: string
  jobTitle: string
  site: string
  dayRate: number
  otRate: number
}

interface PreviousPaylaw {
  id: string
  site: string
  month: number
  year: number
}

interface WorkerRow {
  employeeId: string
  name: string
  jobTitle: string
  dayRate: number
  attendance: Record<string, boolean>
  deduction: number
  signature: string
  active: boolean
}

interface Props {
  employees: Employee[]
  previousPaylaws: PreviousPaylaw[]
  currency: string
  foremanSite: string
  isForeman: boolean
  preparedByDefault: string
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa']

export default function NewPaylawClient({
  employees,
  previousPaylaws,
  currency,
  foremanSite,
  isForeman,
  preparedByDefault,
}: Props) {
  const router = useRouter()

  const symbol = getCurrencySymbol(currency)
  const format = (amount: number) => formatMoney(amount, currency)

  const now = new Date()
  const [site, setSite]               = useState(isForeman ? foremanSite : '')
  const [month, setMonth]             = useState(now.getMonth() + 1)
  const [year, setYear]               = useState(now.getFullYear())
  const [preparedBy, setPreparedBy]   = useState(preparedByDefault)
  const [foodExpense, setFoodExpense] = useState('0')
  const [otherDeduct, setOtherDeduct] = useState('0')
  const [rows, setRows]               = useState<WorkerRow[]>([])
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')
  const [copying, setCopying]         = useState(false)
  const [copySuccess, setCopySuccess] = useState('')

  const daysInMonth = useMemo(
    () => new Date(year, month, 0).getDate(),
    [month, year]
  )

  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function getDayOfWeek(day: number) {
    return new Date(year, month - 1, day).getDay()
  }

  function isWeekend(day: number) {
    const d = getDayOfWeek(day)
    return d === 0 || d === 6
  }

  async function copyFromPaylaw(paylawId: string) {
    if (!paylawId) return
    setCopying(true)
    setCopySuccess('')
    setError('')
    try {
      const res = await fetch(`/api/paylaws/${paylawId}/workers`)
      if (!res.ok) {
        setError('Could not load workers from that paylaw')
        return
      }
      const data = await res.json()
      const newWorkers: WorkerRow[] = []
      for (const w of data.workers) {
        if (!rows.find(r => r.employeeId === w.employeeId)) {
          newWorkers.push({
            employeeId: w.employeeId,
            name:       w.name,
            jobTitle:   w.jobTitle,
            dayRate:    w.dayRate,
            attendance: {},
            deduction:  0,
            signature:  '',
            active:     true,
          })
        }
      }
      setRows(prev => [...prev, ...newWorkers])
      if (!site && data.site) setSite(data.site)
      setCopySuccess(
        `Copied ${newWorkers.length} worker${newWorkers.length !== 1 ? 's' : ''} from ${data.site}`
      )
    } catch {
      setError('Something went wrong copying workers')
    } finally {
      setCopying(false)
    }
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
      name:       emp.name,
      jobTitle:   emp.jobTitle,
      dayRate:    emp.dayRate,
      attendance: {},
      deduction:  0,
      signature:  '',
      active:     emp.active,
    }])
    setSelectedEmpId('')
  }

  function removeWorker(employeeId: string) {
    setRows(prev => prev.filter(r => r.employeeId !== employeeId))
  }

  function toggleDay(employeeId: string, day: number) {
    setRows(prev => prev.map(row => {
      if (row.employeeId !== employeeId) return row
      if (!row.active) return row
      const key = String(day)
      return {
        ...row,
        attendance: { ...row.attendance, [key]: !row.attendance[key] },
      }
    }))
  }

  function updateRate(employeeId: string, rate: string) {
    setRows(prev => prev.map(row =>
      row.employeeId === employeeId
        ? { ...row, dayRate: parseFloat(rate) || 0 }
        : row
    ))
  }

  function updateDeduction(employeeId: string, val: string) {
    setRows(prev => prev.map(row =>
      row.employeeId === employeeId
        ? { ...row, deduction: parseFloat(val) || 0 }
        : row
    ))
  }

  function daysWorked(row: WorkerRow) {
    return Object.values(row.attendance).filter(Boolean).length
  }

  function grossAmount(row: WorkerRow) {
    return daysWorked(row) * row.dayRate
  }

  function netAmount(row: WorkerRow) {
    return Math.max(grossAmount(row) - row.deduction, 0)
  }

  const totalGross   = rows.reduce((t, r) => t + grossAmount(r), 0)
  const totalDeduct  = rows.reduce((t, r) => t + r.deduction, 0)
  const totalNet     = rows.reduce((t, r) => t + netAmount(r), 0)
  const totalDaysAll = rows.reduce((t, r) => t + daysWorked(r), 0)

  async function handleSave(
    status: 'draft' | 'done' | 'submitted' | 'approved'
  ) {
    if (!site || !preparedBy) {
      setError('Site name and Prepared by are required')
      return
    }
    if (rows.length === 0) {
      setError('Add at least one worker')
      return
    }

    // Check duplicate workers in same month different site
    try {
      const checkRes = await fetch('/api/paylaws/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds: rows.map(r => r.employeeId),
          month, year, site,
        }),
      })
      const checkData = await checkRes.json()
      if (checkData.duplicates && checkData.duplicates.length > 0) {
        setError(
          `These workers already have a paylaw this month at a different site: ${checkData.duplicates.join(', ')}`
        )
        return
      }
    } catch {
      // Continue if check fails
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/paylaws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site, month, year, preparedBy,
          foodExpense, otherDeduct, status,
          rows: rows.map(row => ({
            employeeId: row.employeeId,
            dayRate:    row.dayRate,
            daysWorked: daysWorked(row),
            amount:     grossAmount(row),
            deduction:  row.deduction,
            netAmount:  netAmount(row),
            attendance: row.attendance,
            signature:  row.signature,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        return
      }

      router.push('/paylaws')
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
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Formula strip */}
      <div className="inline-flex items-center gap-2 bg-green-50 border
                      border-green-100 rounded-lg px-4 py-2 text-sm
                      text-gray-600 flex-wrap">
        <span className="text-gray-400">Formula:</span>
        <span className="font-medium text-gray-800">Net pay</span>
        <span className="text-gray-400">=</span>
        <span className="bg-green-100 text-green-800 font-medium
                         px-2 py-0.5 rounded">
          days worked × rate
        </span>
        <span className="text-gray-400">−</span>
        <span className="bg-red-100 text-red-700 font-medium
                         px-2 py-0.5 rounded">
          deduction
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">
          Currency: <strong className="text-gray-600">{symbol} {currency}</strong>
        </span>
      </div>

      {/* Copy from previous */}
      {previousPaylaws.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-900 mb-1">
            Copy workers from a previous paylaw
          </p>
          <p className="text-xs text-blue-600 mb-3">
            Adds all workers instantly. Attendance and deductions start fresh.
          </p>
          <div className="flex gap-2 flex-wrap">
            <select
              className="flex-1 min-w-0 border border-blue-200 rounded-lg
                         px-3 py-2 text-sm outline-none bg-white
                         focus:border-blue-400"
              defaultValue=""
              onChange={e => copyFromPaylaw(e.target.value)}
            >
              <option value="">Select a previous paylaw...</option>
              {previousPaylaws.map(p => (
                <option key={p.id} value={p.id}>
                  {p.site} — {MONTH_NAMES[p.month - 1]} {p.year}
                </option>
              ))}
            </select>
            {copying && (
              <span className="text-xs text-blue-600 self-center">
                Copying...
              </span>
            )}
          </div>
          {copySuccess && (
            <p className="text-xs text-green-700 mt-2">✓ {copySuccess}</p>
          )}
        </div>
      )}

      {/* Sheet Info */}
      <div className="bg-white border border-gray-100 rounded-xl
                      p-4 sm:p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase
                      tracking-wider mb-4 flex items-center gap-3
                      after:flex-1 after:h-px after:bg-gray-100
                      after:content-['']">
          Sheet info
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4
                        gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Site name
            </label>
            {isForeman ? (
              <div className="border border-gray-200 rounded-lg px-3
                              py-2 text-sm bg-gray-50 text-gray-600
                              flex items-center justify-between">
                <span>{foremanSite}</span>
                <span className="text-xs text-gray-300 bg-gray-100
                                 px-2 py-0.5 rounded">
                  Your site
                </span>
              </div>
            ) : (
              <input
                className="border border-gray-200 rounded-lg px-3 py-2
                           text-sm outline-none focus:border-gray-400"
                placeholder="e.g. Lusaka Central"
                value={site}
                onChange={e => setSite(e.target.value)}
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Month
            </label>
            <select
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400
                         bg-white"
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Year
            </label>
            <input
              type="number"
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Prepared by
            </label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400"
              placeholder="Your name"
              value={preparedBy}
              onChange={e => setPreparedBy(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="bg-white border border-gray-100 rounded-xl
                      p-4 md:p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase
                      tracking-wider mb-1 flex items-center gap-3
                      after:flex-1 after:h-px after:bg-gray-100
                      after:content-['']">
          Monthly attendance, rates &amp; deductions
        </p>

        <div className="flex items-center justify-between flex-wrap
                        gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-500
                          flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-green-100 border
                               border-green-300 flex items-center
                               justify-center text-green-700 font-bold">
                ✓
              </span>
              Present
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-gray-100 border
                               border-gray-200 inline-block"/>
              Inactive
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs
                        text-gray-400 mb-2 px-1">
          <span className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor"
                    strokeWidth="1.3" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
            Scroll to see all days
          </span>
          <span className="flex items-center gap-1">
            Scroll to see all days
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor"
                    strokeWidth="1.3" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
          </span>
        </div>

        {/* Add worker */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select
            className="flex-1 min-w-0 border border-gray-200 rounded-lg
                       px-3 py-2 text-sm outline-none
                       focus:border-gray-400 bg-white"
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
          >
            <option value="">Add individual worker...</option>
            {availableEmployees.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.jobTitle} ({symbol} {e.dayRate}/day)
              </option>
            ))}
          </select>
          <button
            onClick={addWorker}
            disabled={!selectedEmpId}
            className="flex items-center gap-2 bg-black text-white
                       text-sm font-medium px-4 py-2 rounded-lg
                       hover:bg-gray-800 disabled:opacity-40
                       disabled:cursor-not-allowed transition-colors
                       shrink-0"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor"
                    strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Add
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl
                          py-12 text-center text-sm text-gray-400">
            No workers added yet.
          </div>
        ) : (
          <div
            className="border border-gray-200 rounded-xl overflow-x-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#86EFAC #F3F4F6',
            }}
          >
            <table style={{
              minWidth: 'max-content',
              borderCollapse: 'separate',
              borderSpacing: 0,
            }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-gray-50 border-b
                                 border-r border-gray-200 text-left text-xs
                                 font-medium text-gray-400 uppercase
                                 tracking-wide px-4 py-3 min-w-40">
                    Name
                  </th>
                  <th className="sticky left-40 z-20 bg-gray-50 border-b
                                 border-r border-gray-200 text-left text-xs
                                 font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-28">
                    Job title
                  </th>
                  <th className="sticky left-68 z-20 bg-gray-50 border-b
                                 border-r border-gray-200 text-center
                                 text-xs font-medium text-gray-400 uppercase
                                 tracking-wide px-3 py-3 min-w-20">
                    {symbol} / day
                  </th>
                  {allDays.map(day => {
                    const weekend = isWeekend(day)
                    return (
                      <th
                        key={day}
                        className={`border-b border-gray-200 text-center
                                    px-0 py-2 min-w-9
                                    ${weekend ? 'bg-amber-50' : 'bg-gray-50'}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-semibold
                            ${weekend ? 'text-amber-600' : 'text-gray-600'}`}>
                            {day}
                          </span>
                          <span className={`text-xs
                            ${weekend ? 'text-amber-400' : 'text-gray-300'}`}>
                            {DAY_LABELS[getDayOfWeek(day)]}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                  <th className="border-b border-l border-gray-200 bg-gray-50
                                 text-center text-xs font-medium text-gray-400
                                 uppercase tracking-wide px-3 py-3 min-w-14">
                    Days
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50
                                 text-right text-xs font-medium text-gray-400
                                 uppercase tracking-wide px-3 py-3 min-w-24">
                    Gross
                  </th>
                  <th className="border-b border-gray-200 bg-red-50
                                 text-center text-xs font-medium text-red-400
                                 uppercase tracking-wide px-3 py-3 min-w-24">
                    Deduct ({symbol})
                  </th>
                  <th className="border-b border-gray-200 bg-green-50
                                 text-right text-xs font-medium text-green-600
                                 uppercase tracking-wide px-3 py-3 min-w-24">
                    Net pay
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50
                                 text-left text-xs font-medium text-gray-400
                                 uppercase tracking-wide px-3 py-3 min-w-24">
                    Signature
                  </th>
                  <th className="border-b border-gray-200 bg-gray-50
                                 px-2 py-3 min-w-10"/>
                </tr>
              </thead>

              <tbody>
                {rows.map(row => {
                  const worked = daysWorked(row)
                  const gross  = grossAmount(row)
                  const net    = netAmount(row)

                  return (
                    <tr
                      key={row.employeeId}
                      className={`border-b border-gray-100
                        ${row.active
                          ? 'hover:bg-gray-50/50'
                          : 'bg-gray-50/50 opacity-70'}`}
                    >
                      {/* Name */}
                      <td className="sticky left-0 z-10 bg-white border-r
                                     border-gray-100 px-4 py-2.5 min-w-40">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium
                            ${row.active
                              ? 'text-gray-900'
                              : 'text-gray-400'}`}>
                            {row.name}
                          </span>
                          {!row.active && (
                            <span className="text-xs bg-gray-100
                                             text-gray-400 px-1.5 py-0.5
                                             rounded-full leading-none
                                             shrink-0">
                              inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Job title */}
                      <td className="sticky left-40 z-10 bg-white border-r
                                     border-gray-100 px-3 py-2.5 text-xs
                                     text-gray-500 min-w-28">
                        {row.jobTitle}
                      </td>

                      {/* Day rate */}
                      <td className="sticky left-68 z-10 bg-white border-r
                                     border-gray-200 px-2 py-2.5 min-w-20">
                        <input
                          type="number"
                          value={row.dayRate}
                          disabled={!row.active}
                          onChange={e => updateRate(
                            row.employeeId, e.target.value
                          )}
                          className={`w-16 text-center text-xs font-semibold
                                      border rounded px-1 py-1 outline-none
                            ${row.active
                              ? 'text-green-700 bg-green-50 border-green-200 focus:border-green-400'
                              : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'}`}
                        />
                      </td>

                      {/* Day cells */}
                      {allDays.map(day => {
                        const present = !!row.attendance[String(day)]
                        const weekend = isWeekend(day)
                        return (
                          <td
                            key={day}
                            className={`px-0.5 py-2 text-center
                              ${weekend ? 'bg-amber-50/40' : ''}`}
                          >
                            <button
                              onClick={() => {
                                if (!row.active) return
                                toggleDay(row.employeeId, day)
                              }}
                              disabled={!row.active}
                              title={
                                !row.active
                                  ? 'Worker is inactive'
                                  : present ? 'Mark absent' : 'Mark present'
                              }
                              className={`w-7 h-7 rounded text-xs font-bold
                                          transition-all mx-auto block
                                ${!row.active
                                  ? 'bg-gray-50 border border-gray-100 cursor-not-allowed'
                                  : present
                                  ? 'bg-green-100 border border-green-300 text-green-700 hover:bg-green-200'
                                  : weekend
                                  ? 'bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100'
                                  : 'bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                              {present && row.active ? '✓' : ''}
                            </button>
                          </td>
                        )
                      })}

                      {/* Days */}
                      <td className="border-l border-gray-100 px-3 py-2.5
                                     text-center text-sm font-semibold
                                     text-gray-800">
                        {worked > 0 ? worked : '—'}
                      </td>

                      {/* Gross */}
                      <td className="px-3 py-2.5 text-right text-sm
                                     font-medium text-gray-600
                                     whitespace-nowrap">
                        {gross > 0
                          ? format(gross)
                          : '—'}
                      </td>

                      {/* Deduction */}
                      <td className="px-2 py-2.5 text-center bg-red-50/30">
                        <input
                          type="number"
                          min="0"
                          value={row.deduction || ''}
                          placeholder="0"
                          disabled={!row.active}
                          onChange={e => updateDeduction(
                            row.employeeId, e.target.value
                          )}
                          className={`w-16 text-center text-xs font-semibold
                                      border rounded px-1 py-1 outline-none
                                      [appearance:textfield]
                                      [&::-webkit-inner-spin-button]:appearance-none
                            ${row.active
                              ? 'text-red-600 bg-white border-red-200 focus:border-red-400'
                              : 'text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed'}`}
                        />
                      </td>

                      {/* Net pay */}
                      <td className="px-3 py-2.5 text-right text-sm
                                     font-semibold text-green-700
                                     whitespace-nowrap bg-green-50/20">
                        {net > 0
                          ? format(net)
                          : '—'}
                      </td>

                      {/* Signature */}
                      <td className="px-2 py-2.5">
                        <input
                          type="text"
                          placeholder="sign…"
                          value={row.signature}
                          disabled={!row.active}
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

                      {/* Remove */}
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

                {/* Totals row */}
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td
                    colSpan={3}
                    className="sticky left-0 z-10 bg-gray-50 px-4 py-2
                               text-xs font-semibold text-gray-500"
                  >
                    Totals
                  </td>
                  {allDays.map(day => {
                    const count = rows.filter(
                      r => r.active && !!r.attendance[String(day)]
                    ).length
                    return (
                      <td key={day} className="text-center px-0.5 py-2">
                        <span className={`text-xs font-semibold
                          ${count > 0 ? 'text-green-700' : 'text-gray-300'}`}>
                          {count > 0 ? count : '—'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="border-l border-gray-200 px-3 py-2
                                 text-center text-xs font-bold text-gray-700">
                    {totalDaysAll}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold
                                 text-gray-600 whitespace-nowrap">
                    {format(totalGross)}
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-bold
                                 text-red-600 whitespace-nowrap
                                 bg-red-50/30">
                    {totalDeduct > 0
                      ? `− ${format(totalDeduct)}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-bold
                                 text-green-700 whitespace-nowrap
                                 bg-green-50/20">
                    {format(totalNet)}
                  </td>
                  <td colSpan={2}/>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Description & Expenses */}
      <div className="bg-white border border-gray-100 rounded-xl
                      p-4 md:p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase
                      tracking-wider mb-4 flex items-center gap-3
                      after:flex-1 after:h-px after:bg-gray-100
                      after:content-['']">
          Description &amp; expenses
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4
                        gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Gross salaries ({symbol})
            </label>
            <input
              readOnly
              value={format(totalGross)}
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm text-gray-600 bg-gray-50 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Total deductions ({symbol})
            </label>
            <input
              readOnly
              value={totalDeduct > 0
                ? `− ${format(totalDeduct)}`
                : format(0)}
              className="border border-red-100 rounded-lg px-3 py-2
                         text-sm text-red-600 bg-red-50 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Net salaries ({symbol})
            </label>
            <input
              readOnly
              value={format(totalNet)}
              className="border border-green-100 rounded-lg px-3 py-2
                         text-sm text-green-700 font-semibold
                         bg-green-50 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500
                               uppercase tracking-wide">
              Food expense ({symbol})
            </label>
            <input
              type="number"
              placeholder="0"
              value={foodExpense}
              onChange={e => setFoodExpense(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2
                         text-sm outline-none focus:border-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Summary + Save buttons */}
      <div className="bg-white border border-gray-100 rounded-xl
                      p-4 sm:p-5 flex flex-col sm:flex-row items-start
                      sm:items-center justify-between gap-4">
        <div className="flex gap-4 md:gap-8 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Workers
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {rows.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Gross pay
            </p>
            <p className="text-xl font-semibold text-gray-600">
              {format(totalGross)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Deductions
            </p>
            <p className="text-xl font-semibold text-red-600">
              − {format(totalDeduct)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Net pay
            </p>
            <p className="text-xl font-semibold text-green-700">
              {format(totalNet)}
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center
                        w-full sm:w-auto">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border
                          border-red-100 rounded-lg px-3 py-2
                          w-full sm:w-auto">
              {error}
            </p>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-200
                       rounded-lg text-gray-600 hover:bg-gray-50
                       transition-colors"
          >
            Cancel
          </button>

          {isForeman ? (
            <>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-200
                           rounded-lg text-gray-700 hover:bg-gray-50
                           transition-colors disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                onClick={() => handleSave('submitted')}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white
                           rounded-lg hover:bg-blue-700 transition-colors
                           disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit for approval ↗'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-4 py-2 text-sm border border-gray-200
                           rounded-lg text-gray-700 hover:bg-gray-50
                           transition-colors disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                onClick={() => handleSave('approved')}
                disabled={saving}
                className="px-4 py-2 text-sm bg-black text-white
                           rounded-lg hover:bg-gray-800 transition-colors
                           disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & approve ✓'}
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  )
}