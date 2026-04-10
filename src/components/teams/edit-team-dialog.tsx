import { useState, useEffect } from 'react'
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
import type { UpdateTeamInput } from '~/shared/schemas/teams'

type TeamData = {
  readonly id: string
  readonly name: string
  readonly leaderId: string | null
}

type EditTeamDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (id: string, data: UpdateTeamInput) => Promise<void>
  readonly team: TeamData | null
  readonly users: ReadonlyArray<{ id: string; name: string; role: string }>
  readonly isSubmitting?: boolean
}

export function EditTeamDialog({
  open,
  onOpenChange,
  onSubmit,
  team,
  users,
  isSubmitting = false,
}: EditTeamDialogProps) {
  const [form, setForm] = useState<UpdateTeamInput>({})

  useEffect(() => {
    if (team) {
      setForm({
        name: team.name,
        leaderId: team.leaderId,
      })
    }
  }, [team])

  function handleChange(field: keyof UpdateTeamInput, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!team) return
    await onSubmit(team.id, form)
  }

  if (!team) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>Update team details and leader assignment.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-team-name">Team Name</Label>
            <Input
              id="edit-team-name"
              required
              value={form.name ?? ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-team-leader">Leader</Label>
            <Select
              value={form.leaderId ?? ''}
              onValueChange={(v) => handleChange('leaderId', v || null)}
            >
              <SelectTrigger id="edit-team-leader">
                <SelectValue placeholder="No leader assigned">
                  {form.leaderId ? users.find((u) => u.id === form.leaderId)?.name : undefined}
                </SelectValue>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
