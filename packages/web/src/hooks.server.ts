import type { Handle } from '@sveltejs/kit'
import type { AuthUser } from '@coms/shared/types'

export const handle: Handle = async ({ event, resolve }) => {
  const [{ auth }, { db }, { users, userEmails }, { eq }] = await Promise.all([
    import('@coms/server/auth'),
    import('@coms/shared/db'),
    import('@coms/shared/db/schema'),
    import('drizzle-orm'),
  ])

  const session = await auth.api.getSession({
    headers: event.request.headers,
  })

  if (!session) {
    event.locals.user = null
    event.locals.session = null
    return resolve(event)
  }

  // Look up app user by primary email first, then secondary emails
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

  event.locals.user = (appUser as AuthUser) ?? null
  event.locals.session = session.session
    ? {
        id: session.session.id,
        userId: session.session.userId,
        expiresAt: new Date(session.session.expiresAt),
      }
    : null

  return resolve(event)
}
