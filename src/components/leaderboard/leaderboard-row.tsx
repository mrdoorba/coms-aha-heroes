import { AlertTriangle } from 'lucide-react'
import { cn } from '~/lib/utils'

type LeaderboardRowEntry = {
  rank: number
  name: string
  avatarUrl: string | null
  score: number
  penaltiCount: number
}

type LeaderboardRowProps = {
  entry: LeaderboardRowEntry
  isCurrentUser: boolean
  showPenalti?: boolean
}

export function LeaderboardRow({ entry, isCurrentUser, showPenalti }: LeaderboardRowProps) {
  const initials = entry.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'tap-active flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5',
        isCurrentUser
          ? 'border-primary/25 from-primary/8 bg-gradient-to-r to-transparent shadow-[0_2px_12px_rgba(50,95,236,0.12)]'
          : 'border-border bg-card hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)]',
      )}
    >
      {/* Rank */}
      <span className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {entry.rank}
      </span>

      {/* Avatar */}
      <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            className="h-full w-full object-cover"
            width={40}
            height={40}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-primary text-sm font-bold">{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-foreground truncate text-sm font-semibold">{entry.name}</span>
        {isCurrentUser && (
          <span className="shrink-0 rounded-full bg-gradient-to-r from-[#325FEC] to-[#759EEE] px-2 py-0.5 text-[10px] font-bold text-white">
            You
          </span>
        )}
      </div>

      {/* Penalti (non-employee only) */}
      {showPenalti && entry.penaltiCount > 0 && (
        <span className="flex shrink-0 items-center gap-1 rounded-xl bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">
          <AlertTriangle className="h-3 w-3" />
          {entry.penaltiCount}
        </span>
      )}

      {/* Score */}
      <span className="bg-primary/8 text-primary shrink-0 rounded-xl px-3 py-1 text-sm font-extrabold">
        {entry.score}
      </span>
    </div>
  )
}
