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

const RANK_STYLES: Record<number, { badge: string; ring: string; glow: string; podium: string }> = {
  1: {
    badge: 'bg-gradient-to-br from-[#F4C144] to-[#FFD97D] text-white shadow-md',
    ring: 'ring-[3px] ring-[#F4C144] glow-gold',
    glow: 'bg-gradient-to-b from-[#F4C144]/10 to-transparent',
    podium: 'bg-gradient-to-t from-[#F4C144]/30 to-[#F4C144]/5',
  },
  2: {
    badge: 'bg-gradient-to-br from-[#C0C0C0] to-[#E8E8E8] text-white shadow-md',
    ring: 'ring-[3px] ring-[#C0C0C0]',
    glow: '',
    podium: 'bg-gradient-to-t from-[#C0C0C0]/20 to-[#C0C0C0]/5',
  },
  3: {
    badge: 'bg-gradient-to-br from-[#CD7F32] to-[#E8A862] text-white shadow-md',
    ring: 'ring-[3px] ring-[#CD7F32]',
    glow: '',
    podium: 'bg-gradient-to-t from-[#CD7F32]/20 to-[#CD7F32]/5',
  },
}

function PodiumItem({
  entry,
  size,
}: {
  entry: PodiumEntry
  size: 'lg' | 'md'
}) {
  const styles = RANK_STYLES[entry.rank] ?? { badge: 'bg-muted text-foreground', ring: 'ring-border', glow: '', podium: 'bg-muted' }
  const avatarSize = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-16 w-16 text-lg'
  const nameSize = size === 'lg' ? 'text-sm font-bold' : 'text-xs font-semibold'
  const scoreSize = size === 'lg' ? 'text-lg font-extrabold' : 'text-sm font-bold'
  const podiumHeight = size === 'lg' ? 'h-20' : 'h-12'

  const initials = entry.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className={cn('flex flex-col items-center gap-1.5 flex-1 relative', styles.glow, 'rounded-t-2xl pt-2')}>
      {/* Rank badge */}
      <div
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
          styles.badge,
        )}
      >
        {entry.rank === 1 ? <Trophy className="h-3.5 w-3.5" /> : entry.rank}
      </div>

      {/* Avatar */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted overflow-hidden shrink-0',
          avatarSize,
          styles.ring,
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
      <div className={cn('w-full rounded-t-lg', podiumHeight, styles.podium)} />
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
