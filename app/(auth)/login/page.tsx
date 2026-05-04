'use client'
// 'use client' means this page runs in the browser
// not on the server — we need this because we use
// useState and form interactions

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  // These hold what the user types
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // This holds any error message to show the user
  const [error, setError]   = useState('')

  // This tracks if we are waiting for the server
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    // Stop the page from refreshing on form submit
    e.preventDefault()
    setError('')
    setLoading(true)

    // Ask NextAuth to log the user in
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false, // don't auto redirect — we handle it below
    })

    setLoading(false)

    if (result?.error) {
      // Show the error under the form
      setError('Incorrect email or password')
      return
    }

    // Login worked — go to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">PL</span>
            </div>
            <span className="text-2xl font-bold tracking-widest">PAYLAW</span>
          </div>
          <p className="text-sm text-gray-500">Construction Payroll</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            Sign in
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Enter your email and password to continue
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                           outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100
                            rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white rounded-lg py-2.5 text-sm font-medium
                         hover:bg-gray-800 transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        </div>

        {/* No sign up link — admin creates accounts */}
        <p className="text-center text-xs text-gray-400 mt-4">
          PayLaw is a private payroll system.{' '}
          <Link href="/home" className="underline underline-offset-2 hover:text-gray-700">
            Learn more
          </Link>
        </p>

      </div>
    </div>
  )
}