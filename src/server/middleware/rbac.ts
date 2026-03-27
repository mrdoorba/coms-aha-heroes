import { createMiddleware } from 'hono/factory'
import type { UserRole } from '~/shared/constants'
import type { AuthUser } from './auth'

type AuthEnv = {
  Variables: {
    authUser: AuthUser
  }
}

export function rbacMiddleware(allowedRoles: readonly UserRole[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get('authUser')

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          success: false,
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: `Role '${user.role}' is not authorized for this action`,
          },
        },
        403,
      )
    }

    await next()
  })
}
