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
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { signOut } from '~/lib/auth-client'
import { getLocale, setLocale } from '~/paraglide/runtime.js'
import { getProfileFn } from '~/server/functions/profile'
import { getDashboardActivityFn } from '~/server/functions/dashboard'

type ProfileData = Awaited<ReturnType<typeof getProfileFn>>
type ActivityItem = {
  id: string
  type: string
  description: string
  createdAt: string
  status: string
  pointValue?: number
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[#1D388B] text-white',
  hr: 'bg-[#325FEC] text-white',
  leader: 'bg-[#6D50B8] text-white',
  employee: 'bg-gray-100 text-gray-700',
}

const LANGUAGES = [
  { code: 'id', label: 'Indonesia' },
  { code: 'en', label: 'English' },
  { code: 'th', label: 'Thai' },
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
      <div className="flex flex-col items-center rounded-xl border border-border bg-white p-6">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div className="mt-3 h-5 w-32 rounded bg-muted" />
        <div className="mt-2 h-4 w-48 rounded bg-muted" />
        <div className="mt-3 h-6 w-16 rounded-full bg-muted" />
        <div className="mt-4 grid w-full grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-white" />
        ))}
      </div>
      <div className="h-48 rounded-xl border border-border bg-white" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl border border-border bg-white" />
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

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    router.navigate({ to: '/login' })
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 pb-24 pt-6 md:pb-8">
      {/* Profile card */}
      <div className="flex flex-col items-center rounded-xl border border-border bg-white p-6 shadow-[0_2px_8px_rgba(29,56,139,0.08)]">
        {/* Avatar */}
        <div className="relative mb-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#325FEC]/15 text-2xl font-bold text-[#325FEC]">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              initials || <User className="h-8 w-8" />
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#325FEC] text-white shadow-sm hover:bg-[#1D388B]"
            aria-label={m.profile_edit_avatar()}
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Name + role */}
        <h1 className="text-lg font-bold text-[#1D388B]">{user.name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
        <Badge
          className={`mt-2 text-xs font-semibold uppercase ${ROLE_COLORS[user.role] ?? ROLE_COLORS.employee}`}
        >
          {user.role}
        </Badge>

        {/* Info grid */}
        <div className="mt-4 grid w-full grid-cols-2 gap-3">
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={m.points_bintang()}
          value={stats.bintangCount}
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-[#F4C144]/15"
          iconColor="text-[#F4C144]"
        />
        <StatCard
          label={m.points_poin_aha()}
          value={stats.directPoinAha - stats.redeemedTotal}
          icon={<Award className="h-5 w-5" />}
          iconBg="bg-[#325FEC]/10"
          iconColor="text-[#325FEC]"
        />
        <StatCard
          label={m.points_penalti()}
          value={stats.penaltiPointsSum}
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-[#6D50B8]/10"
          iconColor="text-[#6D50B8]"
        />
      </div>

      {/* Recent points */}
      {(activity as ActivityItem[]).length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-[0_2px_8px_rgba(29,56,139,0.08)]">
          <h2 className="mb-3 text-sm font-semibold text-[#1D388B]">
            {m.profile_recent_points()}
          </h2>
          <div className="space-y-2">
            {(activity as ActivityItem[]).map((item) => (
              <Link
                key={item.id}
                to="/points/$id"
                params={{ id: item.id }}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="text-muted-foreground line-clamp-1 flex-1">
                  {item.description}
                </span>
                <span className="ml-2 shrink-0 text-xs text-muted-foreground">
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

      {/* Actions */}
      <div className="space-y-2">
        <Link
          to="/change-password"
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-[0_2px_8px_rgba(29,56,139,0.08)]"
        >
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          {m.change_password_title()}
        </Link>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-[0_2px_8px_rgba(29,56,139,0.08)]">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium text-foreground">
            {m.profile_language()}
          </span>
          <div className="flex rounded-md border border-border">
            {LANGUAGES.map((lang) => {
              const isActive = getLocale() === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    if (!isActive) setLocale(lang.code)
                  }}
                  className={`px-2.5 py-1 text-xs font-medium first:rounded-l-md last:rounded-r-md transition-colors ${
                    isActive
                      ? 'bg-[#325FEC] text-white'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {lang.code.toUpperCase()}
                </button>
              )
            })}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-3 rounded-xl border-red-200 py-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? m.profile_logging_out() : m.profile_logout()}
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
    <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-xs font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-white p-3 shadow-[0_2px_8px_rgba(29,56,139,0.08)]">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
      >
        {icon}
      </div>
      <span className="text-lg font-bold text-[#1D388B]">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
