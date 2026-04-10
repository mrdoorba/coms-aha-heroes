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
import { resolveChallengeFn } from '~/server/functions/challenges'
import { resolveAppealFn } from '~/server/functions/appeals'
import { useRouter } from '@tanstack/react-router'
import { cn } from '~/lib/utils'
import { Check, X } from 'lucide-react'

interface ResolveDialogProps {
  type: 'challenge' | 'appeal'
  id: string // challengeId or appealId
  trigger?: React.ReactElement
}

export function ResolveDialog({ type, id, trigger }: ResolveDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState<'upheld' | 'overturned'>('upheld')
  const [resolutionNote, setResolutionNote] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const router = useRouter()

  async function onSubmit() {
    if (!resolutionNote.trim()) return

    setIsSubmitting(true)
    try {
      if (type === 'challenge') {
        await resolveChallengeFn({ data: { challengeId: id, status, resolutionNote } })
      } else {
        await resolveAppealFn({ data: { appealId: id, status, resolutionNote } })
      }
      toast.success(type === 'challenge' ? m.resolve_success_challenge() : m.resolve_success_appeal())
      setOpen(false)
      setResolutionNote('')
      router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (type === 'challenge' ? m.resolve_failed_challenge() : m.resolve_failed_appeal()))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm" className="bg-primary hover:bg-primary/80 rounded-xl">Resolve</Button>} />
      <DialogContent className="sm:max-w-[425px] rounded-[20px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'challenge' ? m.resolve_challenge_title() : m.resolve_appeal_title()}
          </DialogTitle>
          <DialogDescription>
            {type === 'challenge' ? m.resolve_description_challenge() : m.resolve_description_appeal()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label>{m.resolve_decision_label()}</Label>
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setStatus('upheld')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                  status === 'upheld'
                    ? "bg-card text-emerald-600 shadow-sm"
                    : "text-muted-foreground hover:bg-card/50"
                )}
              >
                <Check className={cn("h-4 w-4", status === 'upheld' ? "opacity-100" : "opacity-0")} />
                {m.status_upheld()}
              </button>
              <button
                type="button"
                onClick={() => setStatus('overturned')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                  status === 'overturned'
                    ? "bg-card text-destructive shadow-sm"
                    : "text-muted-foreground hover:bg-card/50"
                )}
              >
                <X className={cn("h-4 w-4", status === 'overturned' ? "opacity-100" : "opacity-0")} />
                {m.status_overturned()}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="resolution-note">{m.resolve_note_label()}</Label>
            <Textarea
              id="resolution-note"
              placeholder={m.resolve_note_placeholder()}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="min-h-[120px] rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={isSubmitting || !resolutionNote.trim()}
            className="w-full bg-primary hover:bg-primary/80 rounded-xl"
          >
            {isSubmitting ? m.common_submitting() : m.resolve_submit()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
