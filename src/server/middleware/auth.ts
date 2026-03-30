import { createMiddleware } from 'hono/factory'
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
  readonly mustChangePassword: boolean
}

type AuthEnv = {
  Variables: {
    authUser: AuthUser
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    return c.json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401)
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
          mustChangePassword: users.mustChangePassword,
        })
        .from(users)
        .where(eq(users.id, secondary.userId))
        .limit(1)
    }
  }

  if (!appUser) {
    return c.json({ success: false, data: null, error: { code: 'USER_NOT_FOUND', message: 'No application user linked to this account' } }, 403)
  }

  if (!appUser.role) {
    return c.json({ success: false, data: null, error: { code: 'NO_ROLE', message: 'User has no assigned role' } }, 403)
  }

  c.set('authUser', appUser as AuthUser)
  await next()
})
