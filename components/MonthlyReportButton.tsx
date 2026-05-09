'use client'

import { useState } from 'react'

interface Props {
  month: number
  year: number
}

export default function MonthlyReportButton({ month, year }: Props) {
  const [loading, setLoading] = useState(false)

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/reports/monthly?month=${month}&year=${year}`
      )

      if (!res.ok) {
        alert('No data found for this month. Create paylaws first.')
        return
      }

      const data = await res.json()

      if (data.sites.length === 0) {
        alert('No payroll data for this month yet.')
        return
      }

      const { generateMonthlyReport } = await import(
        '@/lib/generateMonthlyReport'
      )
      generateMonthlyReport(data)
    } catch {
      alert('Something went wrong generating the report.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 bg-black text-white text-sm
                 font-medium px-4 py-2 rounded-lg hover:bg-gray-800
                 transition-colors disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path d="M2 10h9M6.5 2v6M3.5 5.5L6.5 8.5L9.5 5.5"
              stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {loading
        ? 'Generating...'
        : `Download ${MONTH_NAMES[month - 1]} ${year} Report`}
    </button>
  )
}