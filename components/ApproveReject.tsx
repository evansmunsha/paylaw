"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  status: string
  isAdmin: boolean
}

export default function ApproveReject({ id, status, isAdmin }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  if (!isAdmin) return null
  if (status !== 'submitted') return null

  async function postAction(action: 'approve' | 'reject') {
    if (loading) return
    if (action === 'reject' && !note.trim()) {
      setError('A rejection reason is required.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/paylaws/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }))
        alert('Error: ' + (err.error || res.statusText))
        setLoading(false)
        return
      }

      // success — refresh to reflect new status
      router.refresh()
    } catch (e) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-2">
        <label htmlFor="reject-note" className="sr-only">
          Rejection reason
        </label>
        <input
          id="reject-note"
          aria-label="Rejection note"
          placeholder="Reason for rejection (required when rejecting)"
          value={note}
          onChange={e => {
            setNote(e.target.value)
            if (error) setError('')
          }}
          className="text-sm px-3 py-2 border border-gray-200 rounded-lg"
        />
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <p className="text-xs text-gray-500">Explain why this sheet was rejected.</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => postAction('approve')}
          disabled={loading}
          className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
        >
          {loading ? 'Working...' : 'Approve'}
        </button>

        <button
          onClick={() => {
            if (!confirm('Reject this paylaw?')) return
            postAction('reject')
          }}
          disabled={loading}
          className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  )
}
