import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Trophy, Star, Users, Calendar, AlertTriangle } from 'lucide-react'
import * as m from '~/paraglide/messages'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Podium } from '~/components/leaderboard/podium'
import { LeaderboardRow } from '~/components/leaderboard/leaderboard-row'
import { getLeaderboardFn } from '~/server/functions/leaderboard'
import { listTeamsFn } from '~/server/functions/teams'

type LeaderboardType = 'bintang' | 'poin_aha' | 'penalti'

type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  teamId: string | null
  score: number
  bintangCount: number
  penaltiCount: number
}

type Team = {
  id: string
  name: string
}

export const Route = createFileRoute('/_authed/leaderboard')({
  loader: async () => {
    const [leaderboardData, teamsData] = await Promise.all([
      getLeaderboardFn({ data: { type: 'bintang', page: 1, limit: 50 } }),
      listTeamsFn({ data: { page: 1, limit: 100 } }),
    ])
    return { leaderboard: leaderboardData, teams: teamsData }
  },
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const initialData = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const currentUserId = session?.appUser?.id ?? ''
  const userRole = session?.appUser?.role ?? 'employee'
  const showPenalti = userRole !== 'employee'

  const tabs: Array<{
    label: string
    value: LeaderboardType
    icon: React.ReactNode
    color: string
  }> = [
    {
      label: m.points_bintang(),
      value: 'bintang',
      icon: <Star className="h-4 w-4" />,
      color: '#F4C144',
    },
    {
      label: m.points_poin_aha(),
      value: 'poin_aha',
      icon: <Trophy className="h-4 w-4" />,
      color: '#325FEC',
    },
    ...(showPenalti
      ? [
          {
            label: m.points_penalti(),
            value: 'penalti' as LeaderboardType,
            icon: <AlertTriangle className="h-4 w-4" />,
            color: '#EF4444',
          },
        ]
      : []),
  ]

  const [activeType, setActiveType] = useState<LeaderboardType>('bintang')
  const [teamId, setTeamId] = useState<string>('')
  const [months, setMonths] = useState<string>('')
  const [entries, setEntries] = useState<LeaderboardEntry[]>(
    initialData.leaderboard.entries as LeaderboardEntry[],
  )
  const [isLoading, setIsLoading] = useState(false)

  const teams: Team[] = (initialData.teams.teams ?? []) as Team[]

  async function fetchLeaderboard(opts?: {
    type?: LeaderboardType
    team?: string
    months?: string
  }) {
    const type = opts?.type ?? activeType
    const team = opts?.team ?? teamId
    const m_ = opts?.months ?? months

    setIsLoading(true)
    try {
      const data = await getLeaderboardFn({
        data: {
          type,
          teamId: team || undefined,
          months: m_ ? Number(m_) : undefined,
          page: 1,
          limit: 50,
        },
      })
      setEntries(data.entries as LeaderboardEntry[])
    } finally {
      setIsLoading(false)
    }
  }

  function handleTypeChange(type: LeaderboardType) {
    setActiveType(type)
    fetchLeaderboard({ type })
  }

  function handleTeamChange(val: string | null) {
    const team = !val || val === 'all' ? '' : val
    setTeamId(team)
    fetchLeaderboard({ team })
  }

  function handleMonthsChange(val: string | null) {
    const m_ = !val || val === 'all' ? '' : val
    setMonths(m_)
    fetchLeaderboard({ months: m_ })
  }

  const top3 = entries.filter((e) => e.rank <= 3)
  const rest = entries.filter((e) => e.rank > 3)
  const scoreLabel =
    activeType === 'bintang'
      ? m.points_bintang()
      : activeType === 'penalti'
        ? m.points_penalti()
        : m.points_poin_aha()

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
            <Trophy className="h-4.5 w-4.5 text-[#7a5800]" />
          </div>
          <h1 className="text-foreground text-xl font-extrabold">{m.nav_leaderboard()}</h1>
        </div>
        {teams.length > 0 && (
          <Select value={teamId || 'all'} onValueChange={handleTeamChange}>
            <SelectTrigger className="border-border bg-card h-9 w-36 rounded-xl text-sm">
              <Users className="text-muted-foreground mr-1 h-3.5 w-3.5" />
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{m.leaderboard_all_teams()}</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tab switcher + period filter */}
      <div className="mx-4 space-y-2">
        <div className="bg-card border-border shadow-card flex gap-1.5 rounded-2xl border p-1.5">
          {tabs.map((tab) => {
            const isActive = activeType === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${tab.color}18, ${tab.color}08)`,
                        color: tab.color,
                        boxShadow: `0 2px 8px ${tab.color}20`,
                        border: `1px solid ${tab.color}30`,
                      }
                    : { color: 'var(--muted-foreground)' }
                }
                onClick={() => handleTypeChange(tab.value)}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Period filter */}
        <Select value={months || 'all'} onValueChange={handleMonthsChange}>
          <SelectTrigger className="border-border bg-card h-9 w-full rounded-xl text-sm">
            <Calendar className="text-muted-foreground mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{m.leaderboard_all_time()}</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-border bg-card h-16 animate-pulse rounded-2xl border" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="bg-primary/8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Trophy className="text-primary/40 h-8 w-8" />
          </div>
          <p className="text-muted-foreground">{m.common_no_data()}</p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && <Podium entries={top3} scoreLabel={scoreLabel} />}

          {/* Ranked list — rank 4+ */}
          {rest.length > 0 && (
            <div className="space-y-2 px-4 pt-2">
              {rest.map((entry, i) => (
                <div
                  key={entry.userId}
                  className="stagger-item"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <LeaderboardRow entry={entry} isCurrentUser={entry.userId === currentUserId} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
