'use client'

import { useRouter } from 'next/navigation'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  userId: string
  userName: string
  userRole: string
  details: string | null
  createdAt: Date
}

interface Props {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  currentType: string
}

// Action colours and labels
const ACTION_STYLES: Record<string, {
  label: string
  bg: string
  text: string
  dot: string
}> = {
  created: {
    label: 'Created',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  updated: {
    label: 'Updated',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  deleted: {
    label: 'Deleted',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  submitted: {
    label: 'Submitted',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-600',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-600',
  },
}

const ENTITY_ICONS: Record<string, string> = {
  paylaw:   '📋',
  overtime: '⏰',
  employee: '👤',
}

function formatTime(date: Date) {
  const d   = new Date(date)
  const now = new Date()
  const diffMs   = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs  = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1)   return 'Just now'
  if (diffMins < 60)  return `${diffMins}m ago`
  if (diffHrs < 24)   return `${diffHrs}h ago`
  if (diffDays < 7)   return `${diffDays}d ago`

  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatFullTime(date: Date) {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AuditClient({
  logs,
  total,
  page,
  limit,
  currentType,
}: Props) {
  const router = useRouter()
  const totalPages = Math.ceil(total / limit)

  function navigate(params: Record<string, string>) {
    const url = new URL(window.location.href)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    router.push(url.pathname + url.search)
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5">

      {/* Filter tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white border border-gray-200
                        rounded-lg p-1 flex-wrap">
          {['all', 'paylaw', 'overtime', 'employee'].map(t => (
            <button
              key={t}
              onClick={() => navigate({ type: t, page: '1' })}
              className={`px-3 py-1.5 rounded-md text-xs font-medium
                          transition-colors capitalize
                ${currentType === t
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'all' ? `All (${total})` : t}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          Showing {Math.min((page - 1) * limit + 1, total)}–
          {Math.min(page * limit, total)} of {total} actions
        </p>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl
                        py-16 text-center">
          <p className="text-sm text-gray-400">No activity yet</p>
          <p className="text-xs text-gray-300 mt-1">
            Actions will appear here as you use the app
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl
                        overflow-hidden">
          <div className="flex flex-col divide-y divide-gray-50">
            {logs.map((log, i) => {
              const style = ACTION_STYLES[log.action] ||
                ACTION_STYLES['updated']

              return (
                <div
                  key={log.id}
                  className="px-5 py-4 flex items-start gap-4
                             hover:bg-gray-50/50 transition-colors"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1
                                  shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full
                                     ${style.dot}`}/>
                    {i < logs.length - 1 && (
                      <div className="w-px flex-1 bg-gray-100 mt-1
                                      min-h-6"/>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between
                                    gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">

                        {/* Entity icon */}
                        <span className="text-base leading-none">
                          {ENTITY_ICONS[log.entityType] || '📄'}
                        </span>

                        {/* Action badge */}
                        <span className={`text-xs font-semibold px-2
                                          py-0.5 rounded-full
                                          ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>

                        {/* Entity name */}
                        <span className="text-sm font-medium text-gray-900
                                         capitalize">
                          {log.entityType}:
                        </span>
                        <span className="text-sm text-gray-700">
                          {log.entityName}
                        </span>
                      </div>

                      {/* Time */}
                      <span
                        className="text-xs text-gray-400 shrink-0"
                        title={formatFullTime(log.createdAt)}
                      >
                        {formatTime(log.createdAt)}
                      </span>
                    </div>

                    {/* Who did it */}
                    <div className="flex items-center gap-2 mt-1.5
                                    flex-wrap">
                      <div className={`w-5 h-5 rounded-full flex items-center
                                       justify-center text-xs font-bold
                                       shrink-0
                        ${log.userRole === 'foreman'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'}`}>
                        {log.userName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs text-gray-500">
                        {log.userName}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded
                                        font-medium
                        ${log.userRole === 'foreman'
                          ? 'bg-blue-50 text-blue-500'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {log.userRole}
                      </span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">
                        {formatFullTime(log.createdAt)}
                      </span>
                    </div>

                    {/* Details — e.g. rejection reason */}
                    {log.details && (
                      <div className="mt-2 text-xs text-gray-500
                                      bg-gray-50 border border-gray-100
                                      rounded-lg px-3 py-2">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            disabled={page <= 1}
            onClick={() => navigate({ page: String(page - 1) })}
            className="flex items-center gap-2 px-4 py-2 text-sm border
                       border-gray-200 rounded-lg text-gray-600
                       hover:bg-gray-50 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7L9 11" stroke="currentColor"
                    strokeWidth="1.4" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => navigate({ page: String(p) })}
                  className={`w-8 h-8 text-xs rounded-lg font-medium
                              transition-colors
                    ${p === page
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {p}
                </button>
              )
            })}
            {totalPages > 7 && (
              <span className="text-gray-400 text-xs px-1">
                ... {totalPages}
              </span>
            )}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => navigate({ page: String(page + 1) })}
            className="flex items-center gap-2 px-4 py-2 text-sm border
                       border-gray-200 rounded-lg text-gray-600
                       hover:bg-gray-50 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3L9 7L5 11" stroke="currentColor"
                    strokeWidth="1.4" strokeLinecap="round"
                    strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

    </div>
  )
}