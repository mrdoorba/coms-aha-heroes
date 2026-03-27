import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import type { CreateTeamInput } from '~/shared/schemas/teams'

type CreateTeamDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (data: CreateTeamInput) => Promise<void>
  readonly branches: ReadonlyArray<{ id: string; name: string }>
  readonly users: ReadonlyArray<{ id: string; name: string; role: string }>
  readonly isSubmitting?: boolean
}

const INITIAL_FORM: CreateTeamInput = {
  name: '',
  branchId: '',
  leaderId: null,
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  onSubmit,
  branches,
  users,
  isSubmitting = false,
}: CreateTeamDialogProps) {
  const [form, setForm] = useState<CreateTeamInput>({ ...INITIAL_FORM })

  function handleChange(field: keyof CreateTeamInput, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
    setForm({ ...INITIAL_FORM })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Add a new team and optionally assign a leader.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-team-name">Team Name</Label>
            <Input
              id="create-team-name"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-team-branch">Branch</Label>
            <Select
              value={form.branchId}
              onValueChange={(v) => handleChange('branchId', v)}
              required
            >
              <SelectTrigger id="create-team-branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-team-leader">Leader (optional)</Label>
            <Select
              value={form.leaderId ?? ''}
              onValueChange={(v) => handleChange('leaderId', v || null)}
            >
              <SelectTrigger id="create-team-leader">
                <SelectValue placeholder="No leader assigned" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
