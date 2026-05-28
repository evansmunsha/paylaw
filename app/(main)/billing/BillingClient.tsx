'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlanLimits } from '@/lib/plans'

interface Props {
  plan:         string
  limits:       PlanLimits
  subStatus:    string
  periodEnd:    string | null
  hasStripe:    boolean
  workerCount:  number
  paylawCount:  number
  foremanCount: number
}

const PLAN_NAMES: Record<string, string> = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
}

const PLAN_COLOURS: Record<string, string> = {
  free:    'bg-gray-100 text-gray-700',
  starter: 'bg-green-100 text-green-700',
  pro:     'bg-blue-100 text-blue-700',
}

export default function BillingClient({
  plan, limits, subStatus, periodEnd,
  hasStripe, workerCount, paylawCount, foremanCount,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState(
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('success') === 'true'
  )
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  async function handleCheckout(
    planName: 'starter' | 'pro',
    period: 'monthly' | 'yearly'
  ) {
    setLoading(`${planName}-${period}`)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName, period }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  

  async function handleSync() {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res  = await fetch('/api/stripe/sync', { method: 'POST' })
      const data = await res.json()
      if (data.synced) {
        setSyncMsg(`Plan synced — refreshing...`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setSyncMsg(data.error || 'Could not sync')
      }
    } catch {
      setSyncMsg('Something went wrong')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-4 md:p-6 flex flex-col gap-5 max-w-3xl">

      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-100 rounded-xl
                        px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Subscription activated!
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Welcome to PayLaw {PLAN_NAMES[plan]}.
              All features are now unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase
                      tracking-wider mb-4 flex items-center gap-3
                      after:flex-1 after:h-px after:bg-gray-100
                      after:content-['']">
          Current plan
        </p>

        {/* Sync button */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center
                        justify-between flex-wrap gap-3">
          <p className="text-xs text-gray-400">
            Paid but still showing free? Click sync.
          </p>
          <div className="flex items-center gap-3">
            {syncMsg && (
              <span className="text-xs text-green-600">{syncMsg}</span>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 text-xs border border-gray-200
                        px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50
                        transition-colors disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  className={syncing ? 'animate-spin' : ''}>
                <path d="M10 6A4 4 0 112 6" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M10 6V3M10 6H7" stroke="currentColor"
                      strokeWidth="1.4" strokeLinecap="round"
                      strokeLinejoin="round"/>
              </svg>
              {syncing ? 'Syncing...' : 'Sync plan with Stripe'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-4 py-1.5 rounded-full
              ${PLAN_COLOURS[plan]}`}>
              {PLAN_NAMES[plan]}
            </span>
            {subStatus === 'past_due' && (
              <span className="text-xs bg-red-50 text-red-600 border
                               border-red-100 px-2 py-1 rounded-full
                               font-medium">
                Payment overdue
              </span>
            )}
            {subStatus === 'canceled' && (
              <span className="text-xs bg-gray-100 text-gray-500
                               px-2 py-1 rounded-full font-medium">
                Canceled
              </span>
            )}
          </div>

          {periodEnd && plan !== 'free' && (
            <p className="text-xs text-gray-400">
              {subStatus === 'canceled'
                ? `Access until ${new Date(periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                : `Renews ${new Date(periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
              }
            </p>
          )}
        </div>

        {/* Usage */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {workerCount}
              {limits.maxWorkers !== -1 && (
                <span className="text-sm font-normal text-gray-400">
                  /{limits.maxWorkers}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Workers</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {paylawCount}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Paylaws</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {foremanCount}
              {limits.foremen !== -1 && limits.foremen > 0 && (
                <span className="text-sm font-normal text-gray-400">
                  /{limits.foremen}
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Foremen</p>
          </div>
        </div>

        {/* Manage subscription */}
        {hasStripe && plan !== 'free' && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <button
              onClick={handlePortal}
              disabled={loading === 'portal'}
              className="flex items-center gap-2 text-sm border
                         border-gray-200 px-4 py-2 rounded-lg
                         text-gray-600 hover:bg-gray-50 transition-colors
                         disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2"
                      stroke="currentColor" strokeWidth="1.3"/>
                <line x1="4" y1="5" x2="10" y2="5" stroke="currentColor"
                      strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="4" y1="7.5" x2="8" y2="7.5"
                      stroke="currentColor" strokeWidth="1.2"
                      strokeLinecap="round"/>
              </svg>
              {loading === 'portal'
                ? 'Opening...'
                : 'Manage subscription, invoices & payment method'}
            </button>
          </div>
        )}
      </div>

      {/* Upgrade options — only show if not on pro */}
      {plan !== 'pro' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-wider mb-4 flex items-center gap-3
                        after:flex-1 after:h-px after:bg-gray-100
                        after:content-['']">
            {plan === 'free' ? 'Upgrade your plan' : 'Upgrade to Pro'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Starter — only show if on free */}
            {plan === 'free' && (
              <div className="border border-green-200 rounded-xl p-5
                              bg-green-50/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-bold text-gray-900">
                    Starter
                  </p>
                  <span className="text-xs bg-green-500 text-white
                                   px-2 py-0.5 rounded-full font-medium">
                    Most popular
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  3 sites · 50 workers · overtime · 1 foreman
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleCheckout('starter', 'monthly')}
                    disabled={!!loading}
                    className="w-full bg-black text-white text-sm
                               font-medium py-2.5 rounded-lg
                               hover:bg-gray-800 transition-colors
                               disabled:opacity-50"
                  >
                    {loading === 'starter-monthly'
                      ? 'Opening...'
                      : '$9 / month'}
                  </button>
                  <button
                    onClick={() => handleCheckout('starter', 'yearly')}
                    disabled={!!loading}
                    className="w-full border border-green-300 text-green-700
                               bg-white text-sm font-medium py-2.5
                               rounded-lg hover:bg-green-50 transition-colors
                               disabled:opacity-50"
                  >
                    {loading === 'starter-yearly'
                      ? 'Opening...'
                      : '$90 / year — save $18'}
                  </button>
                </div>
              </div>
            )}

            {/* Pro */}
            <div className={`border border-blue-200 rounded-xl p-5
                             bg-blue-50/30
                             ${plan === 'free' ? '' : 'md:col-span-2'}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-bold text-gray-900">Pro</p>
                <span className="text-xs bg-blue-500 text-white
                                 px-2 py-0.5 rounded-full font-medium">
                  Best value
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Unlimited everything · all foremen · all reports
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleCheckout('pro', 'monthly')}
                  disabled={!!loading}
                  className="w-full bg-blue-600 text-white text-sm
                             font-medium py-2.5 rounded-lg
                             hover:bg-blue-700 transition-colors
                             disabled:opacity-50"
                >
                  {loading === 'pro-monthly' ? 'Opening...' : '$19 / month'}
                </button>
                <button
                  onClick={() => handleCheckout('pro', 'yearly')}
                  disabled={!!loading}
                  className="w-full border border-blue-300 text-blue-700
                             bg-white text-sm font-medium py-2.5 rounded-lg
                             hover:bg-blue-50 transition-colors
                             disabled:opacity-50"
                >
                  {loading === 'pro-yearly'
                    ? 'Opening...'
                    : '$190 / year — save $38'}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Payments are secure and processed by Stripe.
            Cancel any time.
          </p>
        </div>
      )}

      {/* Feature comparison */}
      <div className="bg-white border border-gray-100 rounded-xl
                      overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">
            What each plan includes
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-medium
                               uppercase tracking-wide px-5 py-3">
                  Feature
                </th>
                {['Free', 'Starter', 'Pro'].map(p => (
                  <th key={p}
                      className={`text-center text-xs font-medium
                                  uppercase tracking-wide px-3 py-3
                        ${p.toLowerCase() === plan
                          ? 'text-gray-900'
                          : 'text-gray-400'}`}>
                    {p}
                    {p.toLowerCase() === plan && (
                      <span className="ml-1 text-xs bg-gray-100
                                       px-1.5 py-0.5 rounded normal-case
                                       tracking-normal font-normal">
                        current
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Sites',             free: '1',     starter: '3',     pro: 'Unlimited' },
                { label: 'Workers',           free: '10',    starter: '50',    pro: 'Unlimited' },
                { label: 'Paylaws/month',     free: '3',     starter: '∞',     pro: '∞' },
                { label: 'Overtime sheets',   free: '❌',    starter: '✅',    pro: '✅' },
                { label: 'Foreman accounts',  free: '❌',    starter: '1',     pro: 'Unlimited' },
                { label: 'PDF download',      free: '✅',    starter: '✅',    pro: '✅' },
                { label: 'Reports & YTD',     free: '❌',    starter: '✅',    pro: '✅' },
                { label: 'Excel export',      free: '❌',    starter: '✅',    pro: '✅' },
                { label: 'Approval workflow', free: '❌',    starter: '✅',    pro: '✅' },
                { label: 'Audit log',         free: '❌',    starter: '❌',    pro: '✅' },
              ].map(row => (
                <tr key={row.label}
                    className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {row.label}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-500">
                    {row.free}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700
                                 font-medium">
                    {row.starter}
                  </td>
                  <td className="px-3 py-3 text-center text-sm text-gray-700
                                 font-medium">
                    {row.pro}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}