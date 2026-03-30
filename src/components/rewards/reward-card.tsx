import { Gift, Pencil } from 'lucide-react'
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
    <div className="card-hover rounded-xl border border-border bg-card flex flex-col overflow-hidden">
      {/* Image / icon area */}
      <div className="relative aspect-square w-full bg-[#325FEC]/8 flex items-center justify-center overflow-hidden">
        {reward.imageUrl ? (
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-[#325FEC]/10">
            <Gift className="h-10 w-10 text-[#325FEC]/60" />
          </div>
        )}
        {/* Edit button overlay for admin */}
        {isAdmin && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(reward)}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Edit reward"
          >
            <Pencil className="h-3.5 w-3.5 text-[#1D388B]" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2">
            {reward.name}
          </p>
          {reward.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {reward.description}
            </p>
          )}
        </div>

        {/* Point cost badge */}
        <span className="inline-flex items-center self-start rounded-full bg-[#F4C144]/20 px-2 py-0.5 text-xs font-semibold text-[#b58a00]">
          {reward.pointCost} Poin AHA
        </span>

        <Button
          size="sm"
          className="w-full rounded-lg bg-[#325FEC] hover:bg-[#1D388B] text-white text-xs h-8 mt-1"
          onClick={() => onRedeem(reward.id)}
        >
          Redeem
        </Button>
      </div>
    </div>
  )
}
