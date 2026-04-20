import Elysia from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '@coms/shared/db'
import { users, userEmails } from '@coms/shared/db/schema'
import {
  getLocalSessionByToken,
  readSessionCookieFromHeaders,
} from '@coms/shared/auth/session'
import type { UserRole } from '@coms/shared/constants'

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
    const token = readSessionCookieFromHeaders(request.headers)
    if (!token) {
      throw new AuthError(401, 'UNAUTHORIZED', 'Authentication required')
    }

    const session = await getLocalSessionByToken(token)
    if (!session) {
      throw new AuthError(401, 'UNAUTHORIZED', 'Authentication required')
    }

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
      .where(eq(users.email, session.email))
      .limit(1)

    if (!appUser) {
      const [secondary] = await db
        .select({ userId: userEmails.userId })
        .from(userEmails)
        .where(eq(userEmails.email, session.email))
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
