'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, companyName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      // Account created — send them to login
      router.push('/login?registered=true')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center
                    justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-white text-sm font-bold tracking-wider">
              PL
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-gray-900">
            PAYLAW
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create your company account
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-100 rounded-2xl
                        p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500
                                 uppercase tracking-wide">
                Your full name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Evans Mwansa"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5
                           text-sm outline-none focus:border-gray-400
                           transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500
                                 uppercase tracking-wide">
                Company name
                <span className="ml-1 text-gray-300 font-normal
                                  normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. Mwansa Construction Ltd"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5
                           text-sm outline-none focus:border-gray-400
                           transition-colors"
              />
              <p className="text-xs text-gray-400">
                Appears at the top of all your PDFs
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500
                                 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                required
                placeholder="you@yourcompany.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5
                           text-sm outline-none focus:border-gray-400
                           transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500
                                 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-2.5
                           text-sm outline-none focus:border-gray-400
                           transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg
                              px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white text-sm font-medium py-3
                         rounded-lg hover:bg-gray-800 transition-colors
                         disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-gray-700 underline underline-offset-2
                           hover:text-gray-900"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* What you get */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: '📋', text: 'Monthly paylaws' },
            { icon: '⏰', text: 'Overtime sheets' },
            { icon: '📄', text: 'PDF payslips' },
          ].map(item => (
            <div
              key={item.text}
              className="bg-white border border-gray-100 rounded-xl
                         p-3 text-center"
            >
              <span className="text-xl block mb-1">{item.icon}</span>
              <span className="text-xs text-gray-500">{item.text}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By creating an account you agree to our{' '}
          <Link href="/home" className="underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}