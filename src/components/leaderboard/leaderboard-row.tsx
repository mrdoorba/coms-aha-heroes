import { cn } from '~/lib/utils'

type LeaderboardRowEntry = {
  rank: number
  name: string
  avatarUrl: string | null
  score: number
}

type LeaderboardRowProps = {
  entry: LeaderboardRowEntry
  isCurrentUser: boolean
}

export function LeaderboardRow({ entry, isCurrentUser }: LeaderboardRowProps) {
  const initials = entry.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
        isCurrentUser
          ? 'border-[#325FEC] bg-[#325FEC]/5'
          : 'border-border bg-card',
      )}
    >
      {/* Rank */}
      <span className="w-7 shrink-0 text-center text-sm font-bold text-muted-foreground">
        {entry.rank}
      </span>

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted overflow-hidden">
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="truncate text-sm font-medium">{entry.name}</span>
        {isCurrentUser && (
          <span className="shrink-0 rounded-full bg-[#325FEC] px-2 py-0.5 text-[10px] font-bold text-white">
            You
          </span>
        )}
      </div>

      {/* Score */}
      <span className="shrink-0 text-sm font-bold text-[#325FEC]">{entry.score}</span>
    </div>
  )
}
