import { Gift, Pencil, Coins } from 'lucide-react'
import { Button } from '~/components/ui/button'

type Reward = {
  id: string
  name: string
  description?: string | null
  pointCost: number
  imageUrl?: string | null
  isActive?: boolean
}

type RewardCardProps = {
  readonly reward: Reward
  readonly isAdmin: boolean
  readonly onRedeem: (id: string) => void
  readonly onEdit?: (reward: Reward) => void
}

export function RewardCard({ reward, isAdmin, onRedeem, onEdit }: RewardCardProps) {
  return (
    <div className="card-hover shine-on-hover group flex flex-col overflow-hidden rounded-2xl bg-white border border-[#325FEC]/8 shadow-[0_2px_12px_rgba(29,56,139,0.07)]">
      {/* Image / icon area */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-[#EDF1FA] to-[#E2E8F4]">
        {reward.imageUrl ? (
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#325FEC]/10">
              <Gift className="h-7 w-7 text-[#325FEC]/50" />
            </div>
          </div>
        )}

        {/* Edit button overlay for admin */}
        {isAdmin && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(reward)}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:bg-white transition-all hover:scale-110 active:scale-95"
            aria-label="Edit reward"
          >
            <Pencil className="h-3.5 w-3.5 text-[#1D388B]" />
          </button>
        )}

        {/* Inactive overlay */}
        {reward.isActive === false && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-muted-foreground shadow-sm">
              Inactive
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2.5 p-3 flex-1">
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground leading-tight line-clamp-2">
            {reward.name}
          </p>
          {reward.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {reward.description}
            </p>
          )}
        </div>

        {/* Point cost */}
        <div className="flex items-center gap-1.5 self-start rounded-xl bg-[#F4C144]/12 px-2.5 py-1 border border-[#F4C144]/25">
          <Coins className="h-3 w-3 text-[#a07700]" />
          <span className="text-xs font-extrabold text-[#a07700]">
            {reward.pointCost}
          </span>
        </div>

        <Button
          size="sm"
          className="w-full rounded-xl btn-gradient-blue text-white text-xs font-bold h-9 shadow-[0_2px_8px_rgba(50,95,236,0.25)] hover:shadow-[0_4px_12px_rgba(50,95,236,0.35)]"
          onClick={() => onRedeem(reward.id)}
        >
          Redeem
        </Button>
      </div>
    </div>
  )
}
