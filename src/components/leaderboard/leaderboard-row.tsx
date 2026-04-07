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
        'tap-active flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5',
        isCurrentUser
          ? 'border-[#325FEC]/25 bg-gradient-to-r from-[#325FEC]/8 to-transparent shadow-[0_2px_12px_rgba(50,95,236,0.12)]'
          : 'border-[#325FEC]/8 bg-white hover:shadow-[0_4px_16px_rgba(29,56,139,0.10)]',
      )}
    >
      {/* Rank */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EDF1FA] text-xs font-bold text-muted-foreground">
        {entry.rank}
      </span>

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#325FEC]/10 overflow-hidden">
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
          <span className="text-sm font-bold text-[#325FEC]">{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <span className="truncate text-sm font-semibold text-foreground">{entry.name}</span>
        {isCurrentUser && (
          <span className="shrink-0 rounded-full bg-gradient-to-r from-[#325FEC] to-[#759EEE] px-2 py-0.5 text-[10px] font-bold text-white">
            You
          </span>
        )}
      </div>

      {/* Score */}
      <span className="shrink-0 rounded-xl bg-[#325FEC]/8 px-3 py-1 text-sm font-extrabold text-[#325FEC]">
        {entry.score}
      </span>
    </div>
  )
}
