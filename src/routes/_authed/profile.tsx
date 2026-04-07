import { useState } from 'react'
import { createFileRoute, useRouter, Link } from '@tanstack/react-router'
import * as m from '~/paraglide/messages'
import {
  User,
  Star,
  Award,
  AlertTriangle,
  KeyRound,
  Globe,
  LogOut,
  Camera,
  Building2,
  Users,
  MapPin,
  Briefcase,
  ChevronRight,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { signOut } from '~/lib/auth-client'
import { getLocale, setLocale } from '~/paraglide/runtime.js'
import { getProfileFn } from '~/server/functions/profile'
import { getDashboardActivityFn } from '~/server/functions/dashboard'

type ProfileData = Awaited<ReturnType<typeof getProfileFn>>
type ActivityItem = {
  id: string
  categoryCode: string
  categoryName: string
  points: number
  status: string
  reason: string
  userName: string
  submitterName: string
  createdAt: string
}

const ROLE_GRADIENTS: Record<string, string> = {
  admin: 'from-[#1D388B] to-[#325FEC]',
  hr: 'from-[#325FEC] to-[#759EEE]',
  leader: 'from-[#6D50B8] to-[#9B7FE8]',
  employee: 'from-[#5a7a9a] to-[#7a9aba]',
}

const LANGUAGES = [
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
  { code: 'th', label: 'TH' },
] as const

export const Route = createFileRoute('/_authed/profile')({
  loader: async () => {
    const [profile, activity] = await Promise.all([
      getProfileFn(),
      getDashboardActivityFn().catch(() => []),
    ])
    return { profile, activity: (activity as ActivityItem[]).slice(0, 5) }
  },
  component: ProfilePage,
  pendingComponent: ProfileSkeleton,
})

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pt-6 animate-pulse">
      <div className="h-48 rounded-2xl bg-[#325FEC]/10" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white border border-[#325FEC]/8" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-white border border-[#325FEC]/8" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-white border border-[#325FEC]/8" />
        ))}
      </div>
    </div>
  )
}

function ProfilePage() {
  const { profile, activity } = Route.useLoaderData()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const { user, stats } = profile as ProfileData

  const initials = user.name
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const roleGradient = ROLE_GRADIENTS[user.role] ?? ROLE_GRADIENTS.employee

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-24 pt-5 md:pb-8">
      {/* Profile hero card */}
      <div className="overflow-hidden rounded-2xl bg-white border border-[#325FEC]/8 shadow-[0_4px_20px_rgba(29,56,139,0.10)]">
        {/* Gradient banner */}
        <div className={`relative h-24 bg-gradient-to-br ${roleGradient}`}>
          <div className="pointer-events-none absolute -right-6 -top-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div className="pointer-events-none absolute left-8 bottom-0 h-16 w-16 rounded-full bg-white/10 blur-lg" />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar — overlapping the banner */}
          <div className="relative -mt-10 mb-3 flex justify-between items-end">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-bold text-[#325FEC] ring-4 ring-white shadow-lg">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  initials || <User className="h-8 w-8" />
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#325FEC] text-white shadow-md hover:bg-[#1D388B] transition-colors"
                aria-label={m.profile_edit_avatar()}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className={`rounded-xl bg-gradient-to-r ${roleGradient} px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm`}>
              {user.role}
            </span>
          </div>

          {/* Name + email */}
          <h1 className="text-lg font-extrabold text-[#1D388B] leading-tight">{user.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>

          {/* Info grid */}
          {(user.department || user.position || user.teamName || user.branchName) && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {user.department && (
                <InfoItem icon={Building2} label={m.profile_department()} value={user.department} />
              )}
              {user.position && (
                <InfoItem icon={Briefcase} label={m.profile_position()} value={user.position} />
              )}
              {user.teamName && (
                <InfoItem icon={Users} label={m.profile_team()} value={user.teamName} />
              )}
              {user.branchName && (
                <InfoItem icon={MapPin} label={m.profile_branch()} value={user.branchName} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={m.points_bintang()}
          value={stats.bintangCount}
          icon={<Star className="h-5 w-5" />}
          gradient="from-[#F4C144] to-[#FFD97D]"
          valueColor="text-[#7a5800]"
          iconColor="text-[#7a5800]"
          bgTint="bg-[#F4C144]/8"
        />
        <StatCard
          label={m.points_poin_aha()}
          value={stats.directPoinAha - stats.redeemedTotal}
          icon={<Award className="h-5 w-5" />}
          gradient="from-[#325FEC] to-[#759EEE]"
          valueColor="text-[#325FEC]"
          iconColor="text-[#325FEC]"
          bgTint="bg-[#325FEC]/8"
        />
        <StatCard
          label={m.points_penalti()}
          value={stats.penaltiPointsSum}
          icon={<AlertTriangle className="h-5 w-5" />}
          gradient="from-[#C73E3E] to-[#E06B6B]"
          valueColor="text-[#C73E3E]"
          iconColor="text-[#C73E3E]"
          bgTint="bg-[#C73E3E]/8"
        />
      </div>

      {/* Recent points */}
      {(activity as ActivityItem[]).length > 0 && (
        <div className="rounded-2xl bg-white border border-[#325FEC]/8 overflow-hidden shadow-[0_2px_12px_rgba(29,56,139,0.07)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#325FEC]/6">
            <h2 className="text-sm font-bold text-[#1D388B]">{m.profile_recent_points()}</h2>
            <Link
              to="/points"
              className="text-xs font-semibold text-[#325FEC] flex items-center gap-0.5 hover:underline"
            >
              {m.mini_leaderboard_view_all()}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-[#325FEC]/5">
            {(activity as ActivityItem[]).map((item) => (
              <Link
                key={item.id}
                to="/points/$id"
                params={{ id: item.id }}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[#325FEC]/3 transition-colors min-h-[44px]"
              >
                <span className="text-foreground line-clamp-1 flex-1 font-medium">
                  {item.reason}
                </span>
                <span className="ml-3 shrink-0 text-xs text-muted-foreground/70">
                  {new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Action list */}
      <div className="space-y-2.5">
        <Link
          to="/change-password"
          className="flex w-full items-center gap-3 rounded-2xl bg-white border border-[#325FEC]/8 px-4 py-3.5 text-sm font-semibold text-foreground hover:bg-[#325FEC]/3 transition-colors shadow-[0_2px_8px_rgba(29,56,139,0.06)] min-h-[52px]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#325FEC]/10">
            <KeyRound className="h-4 w-4 text-[#325FEC]" />
          </div>
          <span className="flex-1">{m.change_password_title()}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
        </Link>

        <div className="flex items-center gap-3 rounded-2xl bg-white border border-[#325FEC]/8 px-4 py-3.5 shadow-[0_2px_8px_rgba(29,56,139,0.06)] min-h-[52px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#325FEC]/10">
            <Globe className="h-4 w-4 text-[#325FEC]" />
          </div>
          <span className="flex-1 text-sm font-semibold text-foreground">{m.profile_language()}</span>
          <div className="flex rounded-xl border border-[#325FEC]/15 bg-[#EDF1FA] overflow-hidden">
            {LANGUAGES.map((lang) => {
              const isActive = getLocale() === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => { if (!isActive) setLocale(lang.code) }}
                  className={`px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-all min-h-[32px] ${
                    isActive
                      ? 'bg-[#325FEC] text-white shadow-sm'
                      : 'text-muted-foreground hover:text-[#325FEC]'
                  }`}
                >
                  {lang.label}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-2xl border-red-200/70 bg-white py-3.5 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 min-h-[52px] shadow-[0_2px_8px_rgba(199,62,62,0.06)]"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="font-semibold">{loggingOut ? m.profile_logging_out() : m.profile_logout()}</span>
        </Button>
      </div>
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-[#EDF1FA] px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#325FEC]/60" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </p>
        <p className="truncate text-xs font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  gradient,
  valueColor,
  iconColor,
  bgTint,
}: {
  label: string
  value: number
  icon: React.ReactNode
  gradient: string
  valueColor: string
  iconColor: string
  bgTint: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-[#325FEC]/8 p-3.5 shadow-[0_2px_10px_rgba(29,56,139,0.07)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(29,56,139,0.12)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgTint} ${iconColor}`}>
        {icon}
      </div>
      <span className={`text-xl font-extrabold leading-none ${valueColor}`}>{value}</span>
      <span className="text-center text-[10px] font-semibold leading-tight text-muted-foreground/70">{label}</span>
    </div>
  )
}
