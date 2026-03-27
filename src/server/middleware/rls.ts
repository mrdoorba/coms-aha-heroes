import { createMiddleware } from 'hono/factory'
import { db } from '~/db'
import { sql } from 'drizzle-orm'
import type { AuthUser } from './auth'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'

type RlsEnv = {
  Variables: {
    authUser: AuthUser
    tx: PostgresJsDatabase<typeof schema>
  }
}

/**
 * Wraps the request in a DB transaction with RLS session variables.
 * Uses SET LOCAL so variables are scoped to the transaction and
 * never leak across pooled connections.
 */
export const rlsMiddleware = createMiddleware<RlsEnv>(async (c, next) => {
  const user = c.get('authUser')

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${user.id}, true)`)
    await tx.execute(sql`SELECT set_config('app.current_branch_id', ${user.branchId}, true)`)
    await tx.execute(sql`SELECT set_config('app.current_role', ${user.role}, true)`)
    await tx.execute(
      sql`SELECT set_config('app.current_team_id', ${user.teamId ?? ''}, true)`,
    )

    c.set('tx', tx as unknown as PostgresJsDatabase<typeof schema>)
    await next()
  })
})
