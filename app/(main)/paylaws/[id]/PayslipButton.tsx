'use client'

import { useState } from 'react'

interface Props {
  paylawId: string
  employeeId: string
  workerName: string
}

export default function PayslipButton({
  paylawId,
  employeeId,
  workerName,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      // Fetch payslip data from API
      const res = await fetch(
        `/api/paylaws/${paylawId}/payslip/${employeeId}`
      )

      if (!res.ok) {
        alert('Could not generate pay slip. Try again.')
        return
      }

      const data = await res.json()

      const { generatePayslipPDF } = await import('@/lib/generatePayslipPDF')
      generatePayslipPDF(data)
    } catch {
      alert('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title={`Download pay slip for ${workerName}`}
      className="text-xs border border-blue-100 px-3 py-1 rounded-lg
                 text-blue-600 bg-blue-50 hover:bg-blue-100
                 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? '...' : 'Pay slip'}
    </button>
  )
}