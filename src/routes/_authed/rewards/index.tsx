import { useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Plus, Gift } from 'lucide-react'
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
      <div className="flex items-center justify-between">
        <div className="h-6 w-36 rounded bg-muted" />
        <div className="h-8 w-24 rounded-lg bg-muted" />
      </div>
      <div className="h-12 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-44 rounded-xl border border-border bg-white" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1D388B]">{m.rewards_catalog_title()}</h1>
        {isAdmin && (
          <Button
            size="sm"
            className="gap-1.5 rounded-lg bg-[#325FEC] hover:bg-[#1D388B] text-white"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            {m.rewards_add()}
          </Button>
        )}
      </div>

      {/* Balance bar */}
      <div className="rounded-xl bg-[#325FEC] px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">{m.rewards_your_balance()}</span>
        <span className="text-lg font-bold text-white">0</span>
      </div>

      {/* Grid */}
      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Gift className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">{m.rewards_empty()}</p>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? m.rewards_empty_admin()
              : m.rewards_empty_user()}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              isAdmin={isAdmin}
              onRedeem={handleRedeem}
              onEdit={openEdit}
            />
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
