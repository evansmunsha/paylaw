'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  id: string
  site: string
}

export default function DeleteOvertime({ id, site }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const confirmed = confirm(
      `Delete the overtime sheet for "${site}"?\n\nThis will remove all overtime records. This cannot be undone.`
    )
    if (!confirmed) return

    setLoading(true)

    try {
      const res = await fetch(`/api/overtime/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        alert('Failed to delete. Please try again.')
        return
      }

      router.refresh()
    } catch {
      alert('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs border border-red-100 px-3 py-1 rounded-lg
                 text-red-600 bg-red-50 hover:bg-red-100 transition-colors
                 disabled:opacity-50"
    >
      {loading ? '...' : 'Del'}
    </button>
  )
}