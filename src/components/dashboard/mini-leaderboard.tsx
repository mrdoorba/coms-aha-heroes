import { Link } from '@tanstack/react-router'
import { ChevronRight, Trophy } from 'lucide-react'
import { cn } from '~/lib/utils'
import * as m from '~/paraglide/messages'

type LeaderboardEntry = {
  rank: number
  name: string
  avatarUrl: string | null
  score: number
  userId: string
}

type MiniLeaderboardProps = {
  entries: LeaderboardEntry[]
  currentUserId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const RANK_STYLES: Record<number, { text: string; badge: string }> = {
  1: { text: 'text-[#F4C144]', badge: 'bg-gradient-to-br from-[#F4C144] to-[#FFD97D] text-white' },
  2: { text: 'text-[#C0C0C0]', badge: 'bg-gradient-to-br from-[#C0C0C0] to-[#E0E0E0] text-white' },
  3: { text: 'text-[#CD7F32]', badge: 'bg-gradient-to-br from-[#CD7F32] to-[#E8A862] text-white' },
}

export function MiniLeaderboard({ entries, currentUserId }: MiniLeaderboardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[#F4C144]" />
          <h3 className="text-sm font-bold text-[#1D388B]">{m.mini_leaderboard_title()}</h3>
        </div>
        <Link
          to="/leaderboard"
          className="group flex items-center gap-0.5 text-xs font-medium text-[#325FEC] hover:underline"
        >
          {m.mini_leaderboard_view_all()}
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{m.common_no_data()}</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId
            const rankStyle = RANK_STYLES[entry.rank]
            return (
              <li
                key={entry.userId}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 transition-colors',
                  isCurrentUser && 'bg-[#325FEC]/5',
                )}
              >
                {/* Rank */}
                {rankStyle ? (
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold', rankStyle.badge)}>
                    {entry.rank}
                  </span>
                ) : (
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}

                {/* Avatar */}
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
                  rankStyle && entry.rank === 1 && 'ring-2 ring-[#F4C144]/40',
                )}>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {getInitials(entry.name)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <span className="flex-1 truncate text-sm font-medium">
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-1 rounded-full bg-gradient-to-r from-[#325FEC] to-[#759EEE] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {m.mini_leaderboard_you()}
                    </span>
                  )}
                </span>

                {/* Score */}
                <span className="shrink-0 text-sm font-extrabold text-[#325FEC]">{entry.score}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
