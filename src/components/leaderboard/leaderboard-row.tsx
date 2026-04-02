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
        'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card cursor-default',
        isCurrentUser
          ? 'border-[#325FEC]/30 bg-gradient-to-r from-[#325FEC]/8 to-transparent ring-1 ring-[#325FEC]/15'
          : 'border-border bg-card',
      )}
    >
      {/* Rank */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
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
          <span className="shrink-0 rounded-full bg-gradient-to-r from-[#325FEC] to-[#759EEE] px-2 py-0.5 text-[10px] font-bold text-white">
            You
          </span>
        )}
      </div>

      {/* Score */}
      <span className="shrink-0 text-sm font-extrabold text-[#325FEC]">{entry.score}</span>
    </div>
  )
}
