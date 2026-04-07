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

const RANK_MEDAL: Record<number, { emoji: string; ring: string; bg: string }> = {
  1: { emoji: '🥇', ring: 'ring-2 ring-[#F4C144]/60', bg: 'bg-[#F4C144]/15' },
  2: { emoji: '🥈', ring: 'ring-2 ring-[#C0C0C0]/60', bg: 'bg-[#C0C0C0]/10' },
  3: { emoji: '🥉', ring: 'ring-2 ring-[#CD7F32]/60', bg: 'bg-[#CD7F32]/10' },
}

const RANK_NUM_STYLE: Record<number, string> = {
  1: 'text-[#F4C144] font-extrabold',
  2: 'text-[#9a9a9a] font-bold',
  3: 'text-[#CD7F32] font-bold',
}

export function MiniLeaderboard({ entries, currentUserId }: MiniLeaderboardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-[#F4C144]/15 shadow-[0_2px_12px_rgba(244,193,68,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#325FEC]/8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4C144]/15">
            <Trophy className="h-3.5 w-3.5 text-[#F4C144]" />
          </div>
          <h3 className="text-sm font-bold text-[#1D388B]">{m.mini_leaderboard_title()}</h3>
        </div>
        <Link
          to="/leaderboard"
          className="group flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#325FEC] hover:bg-[#325FEC]/8 transition-colors"
        >
          {m.mini_leaderboard_view_all()}
          <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{m.common_no_data()}</p>
      ) : (
        <ul className="divide-y divide-[#325FEC]/5">
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId
            const medal = RANK_MEDAL[entry.rank]
            const numStyle = RANK_NUM_STYLE[entry.rank]
            return (
              <li
                key={entry.userId}
                className={cn(
                  'tap-active flex items-center gap-2.5 px-4 py-2.5 transition-colors',
                  isCurrentUser
                    ? 'bg-gradient-to-r from-[#325FEC]/6 to-transparent'
                    : 'hover:bg-[#325FEC]/3',
                )}
              >
                {/* Rank */}
                <span className={cn('w-5 shrink-0 text-center text-sm', numStyle ?? 'text-muted-foreground text-xs font-medium')}>
                  {entry.rank <= 3 ? medal?.emoji : entry.rank}
                </span>

                {/* Avatar */}
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#325FEC]/10',
                  medal?.ring,
                )}>
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.name}
                      className="h-full w-full object-cover"
                      width={32}
                      height={32}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#325FEC]">{getInitials(entry.name)}</span>
                  )}
                </div>

                {/* Name */}
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {entry.name}
                  {isCurrentUser && (
                    <span className="ml-1.5 rounded-full bg-gradient-to-r from-[#325FEC] to-[#759EEE] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      {m.mini_leaderboard_you()}
                    </span>
                  )}
                </span>

                {/* Score */}
                <span className="shrink-0 rounded-lg bg-[#325FEC]/8 px-2 py-0.5 text-xs font-extrabold text-[#325FEC]">
                  {entry.score}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
