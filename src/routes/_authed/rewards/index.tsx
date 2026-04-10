import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus, Gift, Coins } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { RewardCard } from '~/components/rewards/reward-card'
import { CreateRewardDialog } from '~/components/rewards/create-reward-dialog'
import { listRewardsFn, createRewardFn, updateRewardFn } from '~/server/functions/rewards'
import type { UserRole } from '~/shared/constants'
import * as m from '~/paraglide/messages'

type Reward = {
  id: string
  name: string
  description?: string | null
  pointCost: number
  imageUrl?: string | null
  isActive?: boolean
}

export const Route = createFileRoute('/_authed/rewards/')({
  loader: async () => {
    const data = await listRewardsFn({ data: { page: 1, limit: 50 } })
    return data
  },
  component: RewardsCatalogPage,
  pendingComponent: RewardsSkeleton,
})

function RewardsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 animate-pulse">
      <div className="h-28 rounded-2xl bg-[#325FEC]/10" />
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 rounded-xl bg-muted" />
        <div className="h-8 w-24 rounded-xl bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  )
}

function RewardsCatalogPage() {
  const initialData = Route.useLoaderData()
  const { session } = Route.useRouteContext()
  const router = useRouter()

  const userRole = (session?.appUser?.role ?? 'employee') as UserRole
  const isAdmin = userRole === 'admin' || userRole === 'hr'

  const [rewards, setRewards] = useState<Reward[]>((initialData.rewards ?? []) as Reward[])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Reward | null>(null)

  async function handleCreate(data: {
    name: string
    description?: string
    pointCost: number
    imageUrl?: string
  }) {
    await createRewardFn({ data })
    const refreshed = await listRewardsFn({ data: { page: 1, limit: 50 } })
    setRewards((refreshed.rewards ?? []) as Reward[])
  }

  async function handleEdit(data: {
    name: string
    description?: string
    pointCost: number
    imageUrl?: string
  }) {
    if (!editTarget) return
    await updateRewardFn({ data: { id: editTarget.id, ...data } })
    const refreshed = await listRewardsFn({ data: { page: 1, limit: 50 } })
    setRewards((refreshed.rewards ?? []) as Reward[])
  }

  function openCreate() {
    setEditTarget(null)
    setDialogOpen(true)
  }

  function openEdit(reward: Reward) {
    setEditTarget(reward)
    setDialogOpen(true)
  }

  function handleRedeem(id: string) {
    router.navigate({ to: '/rewards/$id/redeem', params: { id } })
  }

  const dialogSubmit = editTarget ? handleEdit : handleCreate

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24 md:pb-8">
      {/* Hero balance bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D388B] via-[#2550C8] to-[#325FEC] p-5 shadow-[0_8px_32px_rgba(29,56,139,0.30)]">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#F4C144]/15 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-8 h-16 w-24 rounded-full bg-[#759EEE]/20 blur-xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
              {m.rewards_your_balance()}
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-white">0</span>
              <span className="text-sm font-semibold text-white/60">Poin AHA</span>
            </div>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Coins className="h-7 w-7 text-[#F4C144]" />
          </div>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-foreground">{m.rewards_catalog_title()}</h1>
        {isAdmin && (
          <Button
            size="sm"
            className="gap-1.5 rounded-xl btn-gradient-blue text-white font-bold shadow-[0_2px_8px_rgba(50,95,236,0.25)] h-9 px-4"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            {m.rewards_add()}
          </Button>
        )}
      </div>

      {/* Grid */}
      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/8">
            <Gift className="h-10 w-10 text-primary/40" />
          </div>
          <div>
            <p className="font-bold text-foreground">{m.rewards_empty()}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? m.rewards_empty_admin() : m.rewards_empty_user()}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {rewards.map((reward, i) => (
            <div key={reward.id} className="stagger-item" style={{ animationDelay: `${i * 40}ms` }}>
              <RewardCard
                reward={reward}
                isAdmin={isAdmin}
                onRedeem={handleRedeem}
                onEdit={openEdit}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <CreateRewardDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditTarget(null)
        }}
        onSubmit={dialogSubmit}
        initialData={editTarget}
      />
    </div>
  )
}
