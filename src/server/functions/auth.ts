import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { users } from '~/db/schema'
import { eq } from 'drizzle-orm'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      return null
    }

    // Look up our app user by email to get role + must_change_password
    const [appUser] = await db
      .select({
        id: users.id,
        role: users.role,
        mustChangePassword: users.mustChangePassword,
        branchId: users.branchId,
        teamId: users.teamId,
      })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    return {
      user: session.user,
      session: session.session,
      appUser: appUser ?? null,
    }
  },
)

export const changePasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { currentPassword: string; newPassword: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session) {
      throw new Error('Not authenticated')
    }

    await auth.api.changePassword({
      headers: request.headers,
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
    })

    // Clear must_change_password flag in our users table
    await db
      .update(users)
      .set({ mustChangePassword: false })
      .where(eq(users.email, session.user.email))

    return { success: true }
  })
