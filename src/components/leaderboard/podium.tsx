import { Trophy } from 'lucide-react'
import { cn } from '~/lib/utils'

type PodiumEntry = {
  rank: number
  name: string
  avatarUrl: string | null
  score: number
}

type PodiumProps = {
  entries: Array<PodiumEntry>
  scoreLabel: string
}

const RANK_COLORS: Record<number, { badge: string; ring: string }> = {
  1: { badge: 'bg-[#F4C144] text-white', ring: 'ring-[#F4C144]' },
  2: { badge: 'bg-[#C0C0C0] text-white', ring: 'ring-[#C0C0C0]' },
  3: { badge: 'bg-[#CD7F32] text-white', ring: 'ring-[#CD7F32]' },
}

function PodiumItem({
  entry,
  size,
}: {
  entry: PodiumEntry
  size: 'lg' | 'md'
}) {
  const colors = RANK_COLORS[entry.rank] ?? { badge: 'bg-muted text-foreground', ring: 'ring-border' }
  const avatarSize = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-16 w-16 text-lg'
  const nameSize = size === 'lg' ? 'text-sm font-bold' : 'text-xs font-semibold'
  const scoreSize = size === 'lg' ? 'text-lg font-bold' : 'text-sm font-bold'
  const podiumHeight = size === 'lg' ? 'h-16' : 'h-10'

  const initials = entry.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      {/* Rank badge */}
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
          colors.badge,
        )}
      >
        {entry.rank === 1 ? <Trophy className="h-3 w-3" /> : entry.rank}
      </div>

      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full ring-2 bg-muted overflow-hidden shrink-0',
          avatarSize,
          colors.ring,
        )}
      >
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-semibold text-muted-foreground">{initials}</span>
        )}
      </div>

      {/* Name */}
      <p className={cn('text-center max-w-[80px] truncate', nameSize)}>{entry.name}</p>

      {/* Score */}
      <p className={cn('text-[#325FEC]', scoreSize)}>{entry.score}</p>

      {/* Podium base */}
      <div className={cn('w-full rounded-t-md bg-muted', podiumHeight)} />
    </div>
  )
}

export function Podium({ entries, scoreLabel: _scoreLabel }: PodiumProps) {
  const rank1 = entries.find((e) => e.rank === 1)
  const rank2 = entries.find((e) => e.rank === 2)
  const rank3 = entries.find((e) => e.rank === 3)

  if (!rank1 && !rank2 && !rank3) return null

  return (
    <div className="flex items-end justify-center gap-2 px-4 pt-4">
      {rank2 ? <PodiumItem entry={rank2} size="md" /> : <div className="flex-1" />}
      {rank1 ? <PodiumItem entry={rank1} size="lg" /> : <div className="flex-1" />}
      {rank3 ? <PodiumItem entry={rank3} size="md" /> : <div className="flex-1" />}
    </div>
  )
}
