import { db } from '@coms/shared/db'
import { users } from '@coms/shared/db/schema'
import { eq } from 'drizzle-orm'
import type { UserRole } from '@coms/shared/constants'

type AppUserInfo = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: UserRole
  readonly branchId: string
  readonly teamId: string | null
  readonly mustChangePassword: boolean
  readonly isActive: boolean
}

/**
 * Looks up our application user by email (the link between Better Auth
 * and our domain model). Returns null if no app user exists for this email.
 */
export async function getAppUserByEmail(
  email: string,
): Promise<AppUserInfo | null> {
  const [appUser] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      branchId: users.branchId,
      teamId: users.teamId,
      mustChangePassword: users.mustChangePassword,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!appUser || !appUser.role) return null

  return appUser as AppUserInfo
}

/**
 * Checks whether a Better Auth user has a corresponding app user.
 * Used during login to validate that the auth account is linked
 * to an active application user.
 */
export async function validateAppUser(email: string): Promise<{
  readonly valid: boolean
  readonly reason?: string
  readonly appUser?: AppUserInfo
}> {
  const appUser = await getAppUserByEmail(email)

  if (!appUser) {
    return { valid: false, reason: 'No application user linked to this account' }
  }

  if (!appUser.isActive) {
    return { valid: false, reason: 'User account has been deactivated' }
  }

  return { valid: true, appUser }
}
