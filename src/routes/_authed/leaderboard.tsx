import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Trophy, Star, Users } from 'lucide-react'
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

type LeaderboardType = 'bintang' | 'poin_aha'

type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  avatarUrl: string | null
  teamId: string | null
  score: number
  bintangCount: number
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

  const tabs: Array<{ label: string; value: LeaderboardType; icon: React.ReactNode }> = [
    { label: m.points_bintang(), value: 'bintang', icon: <Star className="h-4 w-4" /> },
    { label: m.points_poin_aha(), value: 'poin_aha', icon: <Trophy className="h-4 w-4" /> },
  ]

  const [activeType, setActiveType] = useState<LeaderboardType>('bintang')
  const [teamId, setTeamId] = useState<string>('')
  const [entries, setEntries] = useState<LeaderboardEntry[]>(
    initialData.leaderboard.entries as LeaderboardEntry[],
  )
  const [isLoading, setIsLoading] = useState(false)

  const teams: Team[] = (initialData.teams.teams ?? []) as Team[]

  async function fetchLeaderboard(opts?: { type?: LeaderboardType; team?: string }) {
    const type = opts?.type ?? activeType
    const team = opts?.team ?? teamId

    setIsLoading(true)
    try {
      const data = await getLeaderboardFn({
        data: {
          type,
          teamId: team || undefined,
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

  const top3 = entries.filter((e) => e.rank <= 3)
  const rest = entries.filter((e) => e.rank > 3)
  const scoreLabel = activeType === 'bintang' ? m.points_bintang() : m.points_poin_aha()

  const tabActiveColor = activeType === 'bintang' ? '#F4C144' : '#325FEC'

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6">
        <h1 className="text-xl font-bold text-[#1D388B]">{m.nav_leaderboard()}</h1>
        {teams.length > 0 && (
          <Select value={teamId || 'all'} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
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

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 mx-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            style={
              activeType === tab.value
                ? { backgroundColor: 'white', color: tabActiveColor, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                : { color: 'var(--muted-foreground)' }
            }
            onClick={() => handleTypeChange(tab.value)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-border bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <Trophy className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">{m.common_no_data()}</p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <Podium entries={top3} scoreLabel={scoreLabel} />
          )}

          {/* Ranked list — rank 4+ */}
          {rest.length > 0 && (
            <div className="space-y-2 px-4 pt-2">
              {rest.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
