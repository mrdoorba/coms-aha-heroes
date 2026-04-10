import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Mail } from 'lucide-react'
import * as m from '~/paraglide/messages'

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
          (body as { message?: string })?.message ?? m.forgot_password_failed(),
        )
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : m.common_something_wrong())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1D388B] to-[#0F0E7F] p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-lg">
        <h1 className="text-center font-manrope text-2xl font-extrabold text-foreground">
          AHA HEROES
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {m.forgot_password_subtitle()}
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg bg-green-50 p-4 text-center">
              <Mail className="h-8 w-8 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                {m.forgot_password_sent_title()}
              </p>
              <p className="text-xs text-green-600">
                {m.forgot_password_sent_body()}
              </p>
            </div>
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              {m.forgot_password_back_to_login()}
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
                className="block text-sm font-medium text-foreground"
              >
                {m.login_email()}
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
            >
              {loading ? m.forgot_password_sending() : m.forgot_password_send_button()}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {m.forgot_password_back_to_login()}
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
