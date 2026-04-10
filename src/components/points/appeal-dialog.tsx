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
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { fileAppealFn } from '~/server/functions/appeals'
import { useRouter } from '@tanstack/react-router'

interface AppealDialogProps {
  pointId: string
  trigger?: React.ReactElement
}

export function AppealDialog({ pointId, trigger }: AppealDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  async function onSubmit() {
    if (!reason.trim()) return

    setIsSubmitting(true)
    try {
      await fileAppealFn({ data: { pointId, reason } })
      toast.success(m.appeal_success())
      setOpen(false)
      setReason('')
      router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : m.appeal_failed())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button variant="outline" className="text-primary border-primary hover:bg-primary/8">Appeal</Button>} />
      <DialogContent className="sm:max-w-[425px] rounded-[20px]">
        <DialogHeader>
          <DialogTitle>{m.appeal_title()}</DialogTitle>
          <DialogDescription>
            {m.appeal_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-relaxed">
              <strong>Point Frozen:</strong> {m.appeal_frozen_note()}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="appeal-reason">{m.appeal_reason_label()}</Label>
            <Textarea
              id="appeal-reason"
              placeholder={m.appeal_reason_placeholder()}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px] rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="w-full bg-primary hover:bg-primary/80 rounded-xl"
          >
            {isSubmitting ? m.common_submitting() : m.appeal_submit()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
