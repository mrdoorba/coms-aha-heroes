import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { authClient, signIn } from '~/lib/auth-client'
import { setLocale } from '~/paraglide/runtime.js'
import * as m from '~/paraglide/messages'

const LANGUAGES = ['id', 'en', 'th'] as const
const LOCALE_COOKIE = 'PARAGLIDE_LOCALE'

function getClientLocale(): string {
  if (typeof document === 'undefined') return 'id'
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`))
  return match?.[1] ?? 'id'
}

// ── Canvas starfield with trails, bright stars, and cosmic dust ──
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const init = useCallback(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const ctxEl = canvasEl.getContext('2d')
    if (!ctxEl) return
    // Non-null aliases for use inside closures (TS can't narrow through them)
    const canvas = canvasEl
    const ctx = ctxEl

    // Responsive sizing
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Center of vortex — offset left like the reference
    const getCx = () => canvas.width * 0.35
    const getCy = () => canvas.height * 0.5

    // Star trail particles orbiting the center
    const TRAIL_COUNT = 200
    const trails = Array.from({ length: TRAIL_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2
      const dist = 40 + Math.random() * Math.max(canvas.width, canvas.height) * 0.6
      return {
        angle,
        dist,
        speed: (0.0002 + Math.random() * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
        size: 0.3 + Math.random() * 1.2,
        opacity: 0.15 + Math.random() * 0.5,
        trailLen: 0.08 + Math.random() * 0.25,
        hue: 200 + Math.random() * 40, // blue range
      }
    })

    // Bright twinkling stars (static position, pulsing brightness)
    const BRIGHT_COUNT = 60
    const brightStars = Array.from({ length: BRIGHT_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 0.8 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 2,
      maxOpacity: 0.4 + Math.random() * 0.6,
    }))

    // Cosmic dust clouds
    const DUST_COUNT = 8
    const dustClouds = Array.from({ length: DUST_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 60 + Math.random() * 180,
      opacity: 0.01 + Math.random() * 0.025,
      hue: 210 + Math.random() * 30,
      drift: (Math.random() - 0.5) * 0.15,
    }))

    let time = 0

    function draw() {
      const w = canvas.width
      const h = canvas.height
      const cx = getCx()
      const cy = getCy()

      // Fade-clear for subtle persistence (trail effect)
      ctx.fillStyle = 'rgba(10, 14, 42, 0.15)'
      ctx.fillRect(0, 0, w, h)

      time += 0.016

      // ── Cosmic dust clouds ──
      for (const dust of dustClouds) {
        dust.x += dust.drift
        if (dust.x > w + dust.radius) dust.x = -dust.radius
        if (dust.x < -dust.radius) dust.x = w + dust.radius

        const grad = ctx.createRadialGradient(dust.x, dust.y, 0, dust.x, dust.y, dust.radius)
        grad.addColorStop(0, `hsla(${dust.hue}, 60%, 60%, ${dust.opacity})`)
        grad.addColorStop(0.5, `hsla(${dust.hue}, 50%, 40%, ${dust.opacity * 0.5})`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(dust.x - dust.radius, dust.y - dust.radius, dust.radius * 2, dust.radius * 2)
      }

      // ── Central light burst ──
      const burstPulse = 0.85 + Math.sin(time * 0.5) * 0.15
      const burstRadius = Math.min(w, h) * 0.4 * burstPulse
      const burst = ctx.createRadialGradient(cx, cy, 0, cx, cy, burstRadius)
      burst.addColorStop(0, 'rgba(180, 210, 255, 0.12)')
      burst.addColorStop(0.2, 'rgba(120, 170, 255, 0.06)')
      burst.addColorStop(0.5, 'rgba(80, 130, 255, 0.02)')
      burst.addColorStop(1, 'transparent')
      ctx.fillStyle = burst
      ctx.beginPath()
      ctx.arc(cx, cy, burstRadius, 0, Math.PI * 2)
      ctx.fill()

      // Bright core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30)
      core.addColorStop(0, 'rgba(220, 235, 255, 0.25)')
      core.addColorStop(0.5, 'rgba(180, 210, 255, 0.08)')
      core.addColorStop(1, 'transparent')
      ctx.fillStyle = core
      ctx.beginPath()
      ctx.arc(cx, cy, 30, 0, Math.PI * 2)
      ctx.fill()

      // ── Star trails (orbiting) ──
      for (const t of trails) {
        t.angle += t.speed

        const x = cx + Math.cos(t.angle) * t.dist
        const y = cy + Math.sin(t.angle) * t.dist

        // Trail line
        const tx = cx + Math.cos(t.angle - t.trailLen * Math.sign(t.speed)) * t.dist
        const ty = cy + Math.sin(t.angle - t.trailLen * Math.sign(t.speed)) * t.dist

        const trailGrad = ctx.createLinearGradient(tx, ty, x, y)
        trailGrad.addColorStop(0, 'transparent')
        trailGrad.addColorStop(1, `hsla(${t.hue}, 70%, 80%, ${t.opacity})`)

        ctx.beginPath()
        ctx.moveTo(tx, ty)
        ctx.lineTo(x, y)
        ctx.strokeStyle = trailGrad
        ctx.lineWidth = t.size
        ctx.stroke()

        // Star head
        ctx.beginPath()
        ctx.arc(x, y, t.size * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${t.hue}, 60%, 90%, ${t.opacity})`
        ctx.fill()
      }

      // ── Bright twinkling stars ──
      for (const s of brightStars) {
        const pulse = (Math.sin(time * s.speed + s.phase) + 1) / 2
        const opacity = s.maxOpacity * (0.3 + pulse * 0.7)
        const glowSize = s.size * (1.5 + pulse * 2)

        // Glow
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowSize)
        glow.addColorStop(0, `rgba(200, 220, 255, ${opacity * 0.6})`)
        glow.addColorStop(0.5, `rgba(150, 190, 255, ${opacity * 0.15})`)
        glow.addColorStop(1, 'transparent')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(s.x, s.y, glowSize, 0, Math.PI * 2)
        ctx.fill()

        // Core dot
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240, 245, 255, ${opacity})`
        ctx.fill()
      }

      // Lens flare streaks from center
      ctx.save()
      ctx.globalAlpha = 0.04 + Math.sin(time * 0.3) * 0.02
      ctx.strokeStyle = 'rgba(180, 210, 255, 0.5)'
      ctx.lineWidth = 1
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + time * 0.02
        const len = Math.min(w, h) * 0.35
        ctx.beginPath()
        ctx.moveTo(cx - Math.cos(a) * 10, cy - Math.sin(a) * 10)
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
        ctx.stroke()
      }
      ctx.restore()

      animRef.current = requestAnimationFrame(draw)
    }

    // Initial full clear
    ctx.fillStyle = '#0a0e2a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    animRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  useEffect(() => {
    const cleanup = init()
    return cleanup
  }, [init])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
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
      setError(signInError.message ?? m.login_failed())
      setLoading(false)
      return
    }

    navigate({ to: '/dashboard' })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e2a]">
      {/* Canvas starfield with trails, bright stars, cosmic dust */}
      <StarField />

      {/* Main content — split layout */}
      <main className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-between gap-8 px-6 md:flex-row md:gap-12 lg:px-8">
        {/* Left hero section */}
        <div className="hidden flex-1 flex-col text-white md:flex">
          <h1 className="login-fade-in text-4xl font-bold tracking-tight drop-shadow-md lg:text-5xl">
            Find Your AHA Moment
          </h1>
          <h2 className="login-fade-in mt-2 text-5xl font-extrabold tracking-tight drop-shadow-lg lg:text-6xl" style={{ animationDelay: '0.15s' }}>
            AHA HEROES
          </h2>
        </div>

        {/* Login panel */}
        <div className="login-fade-in w-full max-w-md rounded-3xl bg-white/95 p-8 shadow-2xl backdrop-blur-sm sm:p-10" style={{ animationDelay: '0.25s' }}>
          <div className="mb-8 text-center">
            <h2 className="font-manrope text-3xl font-bold tracking-wide text-[#1a1a1a]">
              AHA HEROES
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {m.login_subtitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 ring-1 ring-red-100">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {m.login_email()}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-sm shadow-sm placeholder-gray-400 transition-all focus:border-[#3B68E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B68E5]/20"
                placeholder="admin@aha.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {m.login_password()}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-4 py-3 pr-10 text-sm shadow-sm placeholder-gray-400 transition-all focus:border-[#3B68E5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B68E5]/20"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? m.login_hide_password() : m.login_show_password()}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#3B68E5] px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#2C51BA] focus:outline-none focus:ring-2 focus:ring-[#3B68E5] focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? m.login_signing_in() : m.login_button()}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-500 transition-colors hover:text-[#3B68E5]"
            >
              {m.login_forgot_password()}
            </Link>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">{m.login_or()}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              authClient.signIn.social({
                provider: 'google',
                callbackURL: '/dashboard',
              })
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3B68E5] focus:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {m.login_google()}
          </button>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-medium tracking-widest text-gray-400">
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
                    className={`rounded px-1.5 py-0.5 transition-colors ${
                      isActive
                        ? 'text-[#3B68E5]'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                </span>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
