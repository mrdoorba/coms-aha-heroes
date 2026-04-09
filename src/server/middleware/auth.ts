import Elysia from 'elysia'
import { auth } from '../auth'
import { db } from '~/db'
import { users, userEmails } from '~/db/schema'
import { eq } from 'drizzle-orm'
import type { UserRole } from '~/shared/constants'

export type AuthUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: UserRole
  readonly branchId: string
  readonly teamId: string | null
  readonly canSubmitPoints: boolean
  readonly mustChangePassword: boolean
}

export const authPlugin = new Elysia({ name: 'auth' }).derive(
  { as: 'scoped' },
  async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new AuthError(
        401,
        'UNAUTHORIZED',
        'Authentication required',
      )
    }

    // Look up by primary email first, then by secondary emails
    let [appUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        branchId: users.branchId,
        teamId: users.teamId,
        canSubmitPoints: users.canSubmitPoints,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (!appUser) {
      const [secondary] = await db
        .select({ userId: userEmails.userId })
        .from(userEmails)
        .where(eq(userEmails.email, session.user.email))
        .limit(1)

      if (secondary) {
        ;[appUser] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            branchId: users.branchId,
            teamId: users.teamId,
            canSubmitPoints: users.canSubmitPoints,
            mustChangePassword: users.mustChangePassword,
          })
          .from(users)
          .where(eq(users.id, secondary.userId))
          .limit(1)
      }
    }

    if (!appUser) {
      throw new AuthError(
        403,
        'USER_NOT_FOUND',
        'No application user linked to this account',
      )
    }

    if (!appUser.role) {
      throw new AuthError(403, 'NO_ROLE', 'User has no assigned role')
    }

    return { authUser: appUser as AuthUser }
  },
)

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
