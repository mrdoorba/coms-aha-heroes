import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '~/lib/auth-client'
import { setLocale } from '~/paraglide/runtime.js'

const LANGUAGES = ['id', 'en', 'th'] as const
const LOCALE_COOKIE = 'PARAGLIDE_LOCALE'

function getClientLocale(): string {
  if (typeof document === 'undefined') return 'id'
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`))
  return match?.[1] ?? 'id'
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentLocale, setCurrentLocale] = useState('id')

  // Sync locale from cookie on client only to avoid hydration mismatch
  useState(() => {
    setCurrentLocale(getClientLocale())
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn.email({ email, password })

    if (signInError) {
      setError(signInError.message ?? 'Login failed')
      setLoading(false)
      return
    }

    navigate({ to: '/dashboard' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1D388B] to-[#0F0E7F]">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-center font-manrope text-2xl font-extrabold text-[#1D388B]">
          AHA HEROES
        </h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#325FEC] focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
              placeholder="admin@aha.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-[#325FEC] focus:outline-none focus:ring-1 focus:ring-[#325FEC]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#325FEC] px-4 py-2 text-sm font-medium text-white hover:bg-[#2850d0] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-500 hover:text-[#325FEC]"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1">
          {LANGUAGES.map((lang, i) => {
            const isActive = currentLocale === lang
            return (
              <span key={lang} className="flex items-center">
                {i > 0 && <span className="mx-1 text-gray-300">|</span>}
                <button
                  type="button"
                  onClick={() => {
                    if (!isActive) setLocale(lang)
                  }}
                  className={`px-1 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[#325FEC]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
