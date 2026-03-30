import * as React from 'react'
import * as m from '~/paraglide/messages'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Label } from '~/components/ui/label'
import { toast } from 'sonner'
import { fileChallengeFn } from '~/server/functions/challenges'
import { useRouter } from '@tanstack/react-router'

interface ChallengeDialogProps {
  pointId: string
  trigger?: React.ReactElement
}

export function ChallengeDialog({ pointId, trigger }: ChallengeDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  async function onSubmit() {
    if (!reason.trim()) return

    setIsSubmitting(true)
    try {
      await fileChallengeFn({ data: { pointId, reason } })
      toast.success(m.challenge_success())
      setOpen(false)
      setReason('')
      router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m.challenge_failed())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button variant="outline" className="text-[#6D50B8] border-[#6D50B8] hover:bg-purple-50">Challenge</Button>} />
      <DialogContent className="sm:max-w-[425px] rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-[#1D388B]">{m.challenge_title()}</DialogTitle>
          <DialogDescription>
            {m.challenge_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">{m.challenge_reason_label()}</Label>
            <Textarea
              id="reason"
              placeholder={m.challenge_reason_placeholder()}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px] rounded-xl"
            />
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Note:</strong> {m.challenge_note()}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="w-full bg-[#325FEC] hover:bg-blue-700 rounded-xl"
          >
            {isSubmitting ? m.common_submitting() : m.challenge_submit()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
