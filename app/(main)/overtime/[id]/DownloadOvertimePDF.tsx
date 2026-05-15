'use client'

import { useState } from 'react'

interface OvertimeRow {
  employeeId: string
  name: string
  jobTitle: string
  otRate: number
  totalHours: number
  amount: number
  hours: Record<string, number>
  signature: string
}

interface Props {
  site: string
  month: number
  year: number
  preparedBy: string
  rows: OvertimeRow[]
  currency: string
}

export default function DownloadOvertimePDF(props: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const settingsRes = await fetch('/api/settings')
      const company     = settingsRes.ok ? await settingsRes.json() : {}

      const { generateOvertimePDF } = await import('@/lib/generateOvertimePDF')
      generateOvertimePDF({ ...props, company }, props.currency)
    } catch {
      alert('Could not generate PDF. Try again.')
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
      {loading ? 'Generating...' : 'Download PDF'}
    </button>
  )
}