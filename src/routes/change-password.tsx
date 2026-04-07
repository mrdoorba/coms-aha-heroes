import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { changePasswordFn } from '~/server/functions/auth'
import * as m from '~/paraglide/messages'

export const Route = createFileRoute('/change-password')({
  component: ChangePasswordPage,
})

function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4
  color: string
} {
  if (!password) return { score: 0, color: 'bg-gray-200' }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++

  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
  ] as const

  const color = colors[Math.min(score, 4) - 1] ?? colors[0]
  return { score: score as 0 | 1 | 2 | 3 | 4, color }
}

function getStrengthLabel(score: number): string {
  if (score <= 1) return m.password_strength_weak()
  if (score === 2) return m.password_strength_fair()
  if (score === 3) return m.password_strength_good()
  return m.password_strength_strong()
}

function ChangePasswordPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword])
  const passwordsMatch = confirmPassword === '' || newPassword === confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError(m.change_password_mismatch())
      return
    }

    setLoading(true)

    try {
      await changePasswordFn({ data: { currentPassword, newPassword } })
      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : m.change_password_failed())
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1D388B] to-[#0F0E7F]">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center font-manrope text-xl font-bold text-[#1D388B]">
          {m.change_password_title()}
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          {m.change_password_subtitle()}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-gray-700"
            >
              {m.change_password_current()}
            </label>
            <div className="relative mt-1">
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[#325FEC] focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showCurrent ? m.login_hide_password() : m.login_show_password()}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              {m.change_password_new()}
            </label>
            <div className="relative mt-1">
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[#325FEC] focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showNew ? m.login_hide_password() : m.login_show_password()}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">{getStrengthLabel(strength.score)}</p>
              </div>
            )}
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              {m.change_password_confirm()}
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 ${
                  !passwordsMatch
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#325FEC] focus:ring-[#325FEC]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirm ? m.login_hide_password() : m.login_show_password()}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!passwordsMatch && (
              <p className="mt-1 text-xs text-red-600">{m.change_password_mismatch()}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !passwordsMatch}
            className="w-full rounded-md bg-[#325FEC] px-4 py-2 text-sm font-medium text-white hover:bg-[#2850d0] disabled:opacity-50"
          >
            {loading ? m.change_password_changing() : m.change_password_title()}
          </button>
        </form>
      </div>
    </div>
  )
}
