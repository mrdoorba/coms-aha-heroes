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
import { USER_ROLES, ROLE_LABELS } from '~/shared/constants'
import type { CreateUserInput } from '~/shared/schemas/users'

type CreateUserDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (data: CreateUserInput) => Promise<void>
  readonly branches: ReadonlyArray<{ id: string; name: string }>
  readonly teams: ReadonlyArray<{ id: string; name: string }>
  readonly isSubmitting?: boolean
}

const INITIAL_FORM: CreateUserInput = {
  email: '',
  name: '',
  role: 'employee',
  branchId: '',
  teamId: null,
  department: '',
  position: '',
  phone: '',
  canSubmitPoints: false,
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  branches,
  teams,
  isSubmitting = false,
}: CreateUserDialogProps) {
  const [form, setForm] = useState<CreateUserInput>({ ...INITIAL_FORM })

  function handleChange(field: keyof CreateUserInput, value: string | null) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      // Auto-default canSubmitPoints when role changes
      if (field === 'role') {
        next.canSubmitPoints = ['admin', 'hr', 'leader'].includes(value ?? '')
      }
      return next
    })
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
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system. They will receive a default password and
            must change it on first login.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@company.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-name">Full Name</Label>
            <Input
              id="create-name"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => handleChange('role', v)}
              >
                <SelectTrigger id="create-role">
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
              <Label htmlFor="create-branch">Branch</Label>
              <Select
                value={form.branchId}
                onValueChange={(v) => handleChange('branchId', v)}
                required
              >
                <SelectTrigger id="create-branch">
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
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-team">Team (optional)</Label>
            <Select
              value={form.teamId ?? ''}
              onValueChange={(v) => handleChange('teamId', v || null)}
            >
              <SelectTrigger id="create-team">
                <SelectValue placeholder="No team" />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="create-dept">Department</Label>
              <Input
                id="create-dept"
                value={form.department ?? ''}
                onChange={(e) => handleChange('department', e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-pos">Position</Label>
              <Input
                id="create-pos"
                value={form.position ?? ''}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={form.canSubmitPoints ?? false}
              onChange={(e) => setForm((prev) => ({ ...prev, canSubmitPoints: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium leading-none">Can Submit Points</p>
              <p className="text-xs text-muted-foreground mt-1">Allow this user to give points to others</p>
            </div>
          </label>
          <div className="grid gap-2">
            <Label htmlFor="create-phone">Phone (optional)</Label>
            <Input
              id="create-phone"
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+62 812 3456 7890"
            />
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
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
