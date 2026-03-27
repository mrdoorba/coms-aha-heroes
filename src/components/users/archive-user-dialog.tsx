import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

type ArchiveUserDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: (id: string) => Promise<void>
  readonly user: { readonly id: string; readonly name: string; readonly email: string } | null
  readonly isSubmitting?: boolean
}

export function ArchiveUserDialog({
  open,
  onOpenChange,
  onConfirm,
  user,
  isSubmitting = false,
}: ArchiveUserDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Archive User</DialogTitle>
          <DialogDescription>
            Are you sure you want to archive <strong>{user.name}</strong> (
            {user.email})? They will no longer be able to log in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(user.id)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Archiving...' : 'Archive User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
