'use client'

import { useState } from 'react'

interface Props {
  type: 'monthly' | 'ytd'
  month?: number
  year: number
  label?: string
}

export default function ExportExcelButton({
  type,
  month,
  year,
  label,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type, year: String(year) })
      if (month) params.set('month', String(month))

      // This triggers a file download directly
      const res = await fetch(`/api/export/excel?${params}`)

      if (!res.ok) {
        alert('Export failed. Please try again.')
        return
      }

      // Convert response to blob and trigger browser download
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')

      // Get filename from response header
      const disposition = res.headers.get('Content-Disposition') || ''
      const match        = disposition.match(/filename="(.+)"/)
      a.download = match ? match[1] : `PayLaw_Export.xlsx`

      a.href = url
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 border border-gray-200
                 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg
                 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {/* Excel icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="1" width="12" height="12" rx="2"
              fill="#16a34a" opacity=".15"/>
        <rect x="1" y="1" width="12" height="12" rx="2"
              stroke="#16a34a" strokeWidth="1.2"/>
        <path d="M4 4.5L6 7L4 9.5M7.5 9.5H10"
              stroke="#16a34a" strokeWidth="1.2"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {loading ? 'Exporting...' : (label || 'Export Excel')}
    </button>
  )
}