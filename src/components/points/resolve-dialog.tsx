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
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} resolved successfully`)
      setOpen(false)
      setResolutionNote('')
      router.invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to resolve ${type}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button size="sm" className="bg-[#1D388B] hover:bg-blue-900 rounded-xl">Resolve</Button>} />
      <DialogContent className="sm:max-w-[425px] rounded-[20px]">
        <DialogHeader>
          <DialogTitle className="text-[#1D388B]">Resolve {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Decide whether to uphold or overturn this {type}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label>Decision</Label>
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setStatus('upheld')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                  status === 'upheld' 
                    ? "bg-white text-green-600 shadow-sm" 
                    : "text-muted-foreground hover:bg-white/50"
                )}
              >
                <Check className={cn("h-4 w-4", status === 'upheld' ? "opacity-100" : "opacity-0")} />
                Upheld
              </button>
              <button
                type="button"
                onClick={() => setStatus('overturned')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                  status === 'overturned' 
                    ? "bg-white text-red-600 shadow-sm" 
                    : "text-muted-foreground hover:bg-white/50"
                )}
              >
                <X className={cn("h-4 w-4", status === 'overturned' ? "opacity-100" : "opacity-0")} />
                Overturned
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="resolution-note">Resolution Note</Label>
            <Textarea
              id="resolution-note"
              placeholder="Provide a reason for your decision..."
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
            className="w-full bg-[#325FEC] hover:bg-blue-700 rounded-xl"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Resolution'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
