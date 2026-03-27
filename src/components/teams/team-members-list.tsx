import { User } from 'lucide-react'
import { UserRoleBadge } from '~/components/users/user-role-badge'
import type { UserRole } from '~/shared/constants'

type Member = {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly department: string | null
  readonly position: string | null
}

type TeamMembersListProps = {
  readonly members: ReadonlyArray<Member>
}

export function TeamMembersList({ members }: TeamMembersListProps) {
  if (members.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">
        No members in this team
      </p>
    )
  }

  return (
    <ul className="divide-y">
      {members.map((member) => (
        <li key={member.id} className="flex items-center gap-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#96ADF5]/20 text-[#325FEC]">
            <User className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-gray-900">
              {member.name}
            </div>
            <div className="truncate text-xs text-gray-500">
              {member.position ?? member.department ?? member.email}
            </div>
          </div>
          <UserRoleBadge role={member.role} />
        </li>
      ))}
    </ul>
  )
}
