import { useState } from 'react'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Gift, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { getRewardByIdFn } from '~/server/functions/rewards'
import { requestRedemptionFn } from '~/server/functions/redemptions'

export const Route = createFileRoute('/_authed/rewards/$id/redeem')({
  loader: async ({ params }) => {
    const reward = await getRewardByIdFn({ data: { id: params.id } })
    return { reward }
  },
  component: RedeemPage,
})

function RedeemPage() {
  const { reward } = Route.useLoaderData()
  const router = useRouter()

  // Hard-code balance at 0 until a balance API is available
  const currentBalance = 0
  const canRedeem = currentBalance >= (reward.pointCost as number)

  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canRedeem) return
    setError(null)
    setIsSubmitting(true)
    try {
      await requestRedemptionFn({
        data: { rewardId: reward.id as string, notes: notes.trim() || undefined },
      })
      router.navigate({ to: '/rewards' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request redemption.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-8">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link to="/rewards">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-[#1D388B]">Redeem Reward</h1>
      </div>

      {/* Reward card */}
      <div className="rounded-xl border border-border bg-card p-5 flex gap-4 items-start">
        <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-[#325FEC]/10 flex items-center justify-center">
          {reward.imageUrl ? (
            <img
              src={reward.imageUrl as string}
              alt={reward.name as string}
              className="h-full w-full object-cover"
            />
          ) : (
            <Gift className="h-8 w-8 text-[#325FEC]/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base leading-snug">{reward.name as string}</p>
          {reward.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {reward.description as string}
            </p>
          )}
          <span className="mt-2 inline-flex items-center rounded-full bg-[#F4C144]/20 px-2.5 py-0.5 text-xs font-semibold text-[#b58a00]">
            {reward.pointCost as number} Poin AHA
          </span>
        </div>
      </div>

      {/* Balance info */}
      <div className="rounded-xl bg-[#325FEC] px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-white/80">Your Poin AHA</span>
        <span className="text-lg font-bold text-white">{currentBalance}</span>
      </div>

      {/* Insufficient balance warning */}
      {!canRedeem && (
        <div className="flex items-start gap-2 rounded-xl border border-[#F4C144]/40 bg-[#F4C144]/10 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[#b58a00]" />
          <p className="text-sm text-[#b58a00] font-medium">
            You need {(reward.pointCost as number) - currentBalance} more Poin AHA to redeem this reward.
          </p>
        </div>
      )}

      {/* Redemption form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="redeem-notes">Keterangan / Notes (optional)</Label>
          <Textarea
            id="redeem-notes"
            placeholder="Add any notes for this redemption request…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!canRedeem || isSubmitting}
          className="w-full rounded-lg bg-[#325FEC] hover:bg-[#1D388B] text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            'Request Redemption'
          )}
        </Button>
      </form>
    </div>
  )
}
