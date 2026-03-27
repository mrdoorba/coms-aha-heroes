import { cn } from '~/lib/utils'
import type { UserRole } from '~/shared/constants'
import { ROLE_LABELS } from '~/shared/constants'

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  hr: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  leader: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  employee: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
}

type UserRoleBadgeProps = {
  readonly role: UserRole
  readonly className?: string
}

export function UserRoleBadge({ role, className }: UserRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        ROLE_STYLES[role],
        className,
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
