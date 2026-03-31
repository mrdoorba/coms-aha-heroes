import Elysia from 'elysia'
import { db } from '~/db'
import { sql } from 'drizzle-orm'
import type { AuthUser } from './auth'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'

/**
 * Wraps each request in a DB transaction with RLS session variables.
 * Uses SET LOCAL so variables are scoped to the transaction and
 * never leak across pooled connections.
 *
 * The transaction stays open for the duration of the request via a
 * deferred promise, then commits in onAfterResponse (or rolls back
 * if the handler threw an unhandled error).
 *
 * Depends on authPlugin having already resolved `authUser`.
 */
export const rlsPlugin = new Elysia({ name: 'rls' })
  .derive({ as: 'scoped' }, async (ctx) => {
    const authUser = (ctx as unknown as { authUser: AuthUser }).authUser
    let settled = false
    let resolveDone!: () => void
    let rejectDone!: (err: Error) => void

    const done = new Promise<void>((resolve, reject) => {
      resolveDone = () => {
        if (!settled) {
          settled = true
          resolve()
        }
      }
      rejectDone = (err) => {
        if (!settled) {
          settled = true
          reject(err)
        }
      }
    })

    let tx!: PostgresJsDatabase<typeof schema>

    await new Promise<void>((resolveReady, rejectReady) => {
      db.transaction(async (transaction) => {
        await transaction.execute(
          sql`SELECT set_config('app.current_user_id', ${authUser.id}, true)`,
        )
        await transaction.execute(
          sql`SELECT set_config('app.current_branch_id', ${authUser.branchId}, true)`,
        )
        await transaction.execute(
          sql`SELECT set_config('app.current_role', ${authUser.role}, true)`,
        )
        await transaction.execute(
          sql`SELECT set_config('app.current_team_id', ${authUser.teamId ?? ''}, true)`,
        )

        tx = transaction as unknown as PostgresJsDatabase<typeof schema>
        resolveReady()

        // Keep transaction open until request lifecycle completes
        await done
      }).catch((err) => {
        // If tx was never assigned, the setup itself failed
        if (!tx) rejectReady(err)
        // Otherwise this is the intentional rollback rejection — swallow it
      })
    })

    return {
      tx,
      __rlsCommit: resolveDone,
      __rlsRollback: rejectDone,
    }
  })
  .onError({ as: 'scoped' }, ({ __rlsRollback, error }: any) => {
    __rlsRollback?.(error instanceof Error ? error : new Error('Request failed'))
  })
  .onAfterResponse({ as: 'scoped' }, ({ __rlsCommit }: any) => {
    // Commits the transaction; no-op if already settled by onError
    __rlsCommit?.()
  })
