import * as React from 'react'
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
      toast.success('Appeal submitted successfully')
      setOpen(false)
      setReason('')
      router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit appeal')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button variant="outline" className="text-[#325FEC] border-[#325FEC] hover:bg-blue-50">Appeal</Button>} />
      <DialogContent className="sm:max-w-[425px] rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-[#1D388B]">Appeal Penalti</DialogTitle>
          <DialogDescription>
            Submit an appeal if you believe this penalty was incorrectly issued.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-xs text-yellow-700 leading-relaxed">
              <strong>Point Frozen:</strong> Filing an appeal will freeze these points. They will not count towards your total until HR makes a final decision.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="appeal-reason">Reason for Appeal</Label>
            <Textarea
              id="appeal-reason"
              placeholder="Provide evidence or explanation for your appeal..."
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
            className="w-full bg-[#325FEC] hover:bg-blue-700 rounded-xl"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
