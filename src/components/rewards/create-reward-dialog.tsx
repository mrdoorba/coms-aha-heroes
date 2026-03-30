import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

type RewardFormData = {
  name: string
  description: string
  pointCost: string
  imageUrl: string
}

type InitialData = {
  id?: string
  name?: string
  description?: string | null
  pointCost?: number
  imageUrl?: string | null
}

type CreateRewardDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (data: {
    name: string
    description?: string
    pointCost: number
    imageUrl?: string
  }) => Promise<void>
  readonly initialData?: InitialData | null
}

const EMPTY_FORM: RewardFormData = {
  name: '',
  description: '',
  pointCost: '',
  imageUrl: '',
}

export function CreateRewardDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: CreateRewardDialogProps) {
  const [form, setForm] = useState<RewardFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditMode = Boolean(initialData?.id)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          name: initialData.name ?? '',
          description: initialData.description ?? '',
          pointCost: initialData.pointCost != null ? String(initialData.pointCost) : '',
          imageUrl: initialData.imageUrl ?? '',
        })
      } else {
        setForm(EMPTY_FORM)
      }
      setError(null)
    }
  }, [open, initialData])

  function handleChange(field: keyof RewardFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cost = parseInt(form.pointCost, 10)
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (isNaN(cost) || cost < 1) {
      setError('Point cost must be a number of at least 1.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        pointCost: cost,
        imageUrl: form.imageUrl.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Reward' : 'Add Reward'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="reward-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reward-name"
              placeholder="e.g. Amazon Gift Card"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reward-description">Description</Label>
            <Textarea
              id="reward-description"
              placeholder="Optional description…"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reward-cost">
              Point Cost <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reward-cost"
              type="number"
              min={1}
              placeholder="e.g. 50"
              value={form.pointCost}
              onChange={(e) => handleChange('pointCost', e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reward-image">Image URL</Label>
            <Input
              id="reward-image"
              type="url"
              placeholder="https://…"
              value={form.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#325FEC] hover:bg-[#1D388B] text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : isEditMode ? 'Save Changes' : 'Add Reward'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
