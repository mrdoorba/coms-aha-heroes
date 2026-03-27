import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '~/lib/utils'

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

const RANK_COLORS: Record<number, string> = {
  1: 'text-[#F4C144] font-bold',
  2: 'text-slate-400 font-bold',
  3: 'text-amber-600 font-bold',
}

export function MiniLeaderboard({ entries, currentUserId }: MiniLeaderboardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1D388B]">Top Poin AHA</h3>
        <Link
          to="/leaderboard"
          className="flex items-center gap-0.5 text-xs text-[#325FEC] hover:underline"
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId
            return (
              <li
                key={entry.userId}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5',
                  isCurrentUser ? 'bg-[#325FEC]/5 ring-1 ring-[#325FEC]/20' : '',
                )}
              >
                <span className={cn('w-5 shrink-0 text-center text-sm', RANK_COLORS[entry.rank] ?? 'text-muted-foreground font-medium')}>
                  {entry.rank}
                </span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {getInitials(entry.name)}
                    </span>
                  )}
                </div>
                <span className="flex-1 truncate text-sm font-medium">
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-1 rounded-full bg-[#325FEC] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      You
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-bold text-[#325FEC]">{entry.score}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
