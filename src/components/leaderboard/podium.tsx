import { Crown, AlertTriangle } from 'lucide-react'
import { cn } from '~/lib/utils'

type PodiumEntry = {
  rank: number
  name: string
  avatarUrl: string | null
  score: number
  penaltiCount: number
}

type PodiumProps = {
  entries: Array<PodiumEntry>
  scoreLabel: string
  showPenalti?: boolean
}

const RANK_STYLES: Record<
  number,
  {
    avatarRing: string
    podiumBg: string
    podiumHeight: string
    scoreBg: string
    scoreText: string
    nameBg: string
    glow: string
  }
> = {
  1: {
    avatarRing: 'ring-4 ring-[#F4C144] glow-gold',
    podiumBg: 'bg-gradient-to-t from-[#F4C144] to-[#FFD97D]',
    podiumHeight: 'h-20',
    scoreBg: 'bg-[#F4C144]/15',
    scoreText: 'text-[#a07700] font-extrabold',
    nameBg: '',
    glow: 'drop-shadow-[0_0_12px_rgba(244,193,68,0.5)]',
  },
  2: {
    avatarRing: 'ring-3 ring-[#C0C0C0]',
    podiumBg: 'bg-gradient-to-t from-[#9a9a9a] to-[#d0d0d0]',
    podiumHeight: 'h-14',
    scoreBg: 'bg-[#C0C0C0]/15',
    scoreText: 'text-muted-foreground font-bold',
    nameBg: '',
    glow: '',
  },
  3: {
    avatarRing: 'ring-3 ring-[#CD7F32]',
    podiumBg: 'bg-gradient-to-t from-[#CD7F32] to-[#E8A862]',
    podiumHeight: 'h-10',
    scoreBg: 'bg-[#CD7F32]/15',
    scoreText: 'text-[#8B5E00] font-bold',
    nameBg: '',
    glow: '',
  },
}

function PodiumItem({
  entry,
  size,
  showPenalti,
}: {
  entry: PodiumEntry
  size: 'lg' | 'md'
  showPenalti?: boolean
}) {
  const styles = RANK_STYLES[entry.rank] ?? {
    avatarRing: '',
    podiumBg: 'bg-muted',
    podiumHeight: 'h-8',
    scoreBg: 'bg-muted',
    scoreText: 'text-muted-foreground',
    nameBg: '',
    glow: '',
  }

  const avatarSize = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'
  const avatarPx = size === 'lg' ? 80 : 56
  const textSize = size === 'lg' ? 'text-sm font-bold' : 'text-xs font-semibold'
  const scoreTextSize = size === 'lg' ? 'text-base' : 'text-sm'

  const initials = entry.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="relative flex flex-1 flex-col items-center gap-1.5">
      {/* Crown for #1 */}
      {entry.rank === 1 && (
        <div className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-lg">
          <Crown className="h-4 w-4 text-[#7a5800]" />
        </div>
      )}
      {entry.rank !== 1 && (
        <div className="bg-card mb-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#C0C0C0] shadow-sm">
          <span className="text-muted-foreground text-xs font-bold">{entry.rank}</span>
        </div>
      )}

      {/* Avatar */}
      <div
        className={cn(
          'bg-primary/10 flex shrink-0 items-center justify-center overflow-hidden rounded-full',
          avatarSize,
          styles.avatarRing,
          styles.glow,
        )}
      >
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.name}
            className="h-full w-full object-cover"
            width={avatarPx}
            height={avatarPx}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-primary text-lg font-bold">{initials}</span>
        )}
      </div>

      {/* Name */}
      <p className={cn('text-foreground max-w-[80px] truncate text-center', textSize)}>
        {entry.name}
      </p>

      {/* Score */}
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs',
          styles.scoreBg,
          styles.scoreText,
          scoreTextSize,
        )}
      >
        {entry.score}
      </span>

      {/* Penalti (non-employee only) */}
      {showPenalti && entry.penaltiCount > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-500">
          <AlertTriangle className="h-2.5 w-2.5" />
          {entry.penaltiCount}
        </span>
      )}

      {/* Podium base */}
      <div
        className={cn('w-full rounded-t-xl shadow-inner', styles.podiumHeight, styles.podiumBg)}
      />
    </div>
  )
}

export function Podium({ entries, scoreLabel: _scoreLabel, showPenalti }: PodiumProps) {
  const rank1 = entries.find((e) => e.rank === 1)
  const rank2 = entries.find((e) => e.rank === 2)
  const rank3 = entries.find((e) => e.rank === 3)

  if (!rank1 && !rank2 && !rank3) return null

  return (
    <div className="from-muted to-card border-border shadow-card mx-4 overflow-hidden rounded-2xl border bg-gradient-to-b px-4 pt-6 pb-0">
      <div className="flex items-end justify-center gap-3">
        {rank2 ? (
          <PodiumItem entry={rank2} size="md" showPenalti={showPenalti} />
        ) : (
          <div className="flex-1" />
        )}
        {rank1 ? (
          <PodiumItem entry={rank1} size="lg" showPenalti={showPenalti} />
        ) : (
          <div className="flex-1" />
        )}
        {rank3 ? (
          <PodiumItem entry={rank3} size="md" showPenalti={showPenalti} />
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}
