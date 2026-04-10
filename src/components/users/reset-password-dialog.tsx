import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import * as m from '~/paraglide/messages'

type ResetPasswordDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onConfirm: (id: string) => Promise<void>
  readonly user: { readonly id: string; readonly name: string; readonly email: string } | null
  readonly isSubmitting?: boolean
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  user,
  isSubmitting = false,
}: ResetPasswordDialogProps) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{m.reset_password_title()}</DialogTitle>
          <DialogDescription>
            {m.reset_password_confirm({ name: user.name, email: user.email })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {m.common_cancel()}
          </Button>
          <Button variant="default" onClick={() => onConfirm(user.id)} disabled={isSubmitting}>
            {isSubmitting ? m.reset_password_resetting() : m.reset_password_button()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
