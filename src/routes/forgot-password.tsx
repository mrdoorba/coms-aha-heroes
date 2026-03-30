import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Mail } from 'lucide-react'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: '/change-password' }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(
          (body as { message?: string })?.message ?? 'Failed to send reset link',
        )
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1D388B] to-[#0F0E7F] p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center font-manrope text-2xl font-extrabold text-[#1D388B]">
          AHA HEROES
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Reset your password
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg bg-green-50 p-4 text-center">
              <Mail className="h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                If an account with that email exists, we&apos;ve sent a reset link.
              </p>
              <p className="text-xs text-green-600">
                Check your inbox and follow the instructions.
              </p>
            </div>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="reset-email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#325FEC] focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#325FEC] px-4 py-2 text-sm font-medium text-white hover:bg-[#2850d0] disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
