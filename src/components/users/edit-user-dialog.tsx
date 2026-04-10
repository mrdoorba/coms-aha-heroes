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
import { USER_ROLES, ROLE_LABELS } from '~/shared/constants'
import type { UpdateUserInput } from '~/shared/schemas/users'

type UserData = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly teamId: string | null
  readonly department: string | null
  readonly position: string | null
  readonly canSubmitPoints: boolean
}

type EditUserDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (id: string, data: UpdateUserInput) => Promise<void>
  readonly user: UserData | null
  readonly teams: ReadonlyArray<{ id: string; name: string }>
  readonly isSubmitting?: boolean
}

export function EditUserDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
  teams,
  isSubmitting = false,
}: EditUserDialogProps) {
  const [form, setForm] = useState<UpdateUserInput>({})

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        role: user.role as UpdateUserInput['role'],
        teamId: user.teamId,
        department: user.department ?? '',
        position: user.position ?? '',
        canSubmitPoints: user.canSubmitPoints,
      })
    }
  }, [user])

  function handleChange(field: keyof UpdateUserInput, value: string | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    await onSubmit(user.id, form)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              required
              value={form.name ?? ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={form.role ?? user.role} onValueChange={(v) => handleChange('role', v)}>
              <SelectTrigger id="edit-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-team">Team</Label>
            <Select
              value={form.teamId ?? ''}
              onValueChange={(v) => handleChange('teamId', v || null)}
            >
              <SelectTrigger id="edit-team">
                <SelectValue placeholder="No team">
                  {form.teamId ? teams.find((t) => t.id === form.teamId)?.name : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="border-border hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="checkbox"
              checked={form.canSubmitPoints ?? false}
              onChange={(e) => setForm((prev) => ({ ...prev, canSubmitPoints: e.target.checked }))}
              className="border-border h-4 w-4 rounded"
            />
            <div>
              <p className="text-sm leading-none font-medium">Can Submit Points</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Allow this user to give points to others
              </p>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-dept">Department</Label>
              <Input
                id="edit-dept"
                value={form.department ?? ''}
                onChange={(e) => handleChange('department', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-pos">Position</Label>
              <Input
                id="edit-pos"
                value={form.position ?? ''}
                onChange={(e) => handleChange('position', e.target.value)}
              />
            </div>
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
