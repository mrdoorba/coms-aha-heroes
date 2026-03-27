import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type * as schema from '~/db/schema'
import { db as defaultDb } from '~/db'

/**
 * All repositories accept an optional transaction (`tx`) parameter.
 * When running inside RLS middleware, pass the transaction so queries
 * execute within the SET LOCAL scope. For operations outside
 * middleware (seed scripts, cron jobs), omit `tx` to use the default pool.
 */
export type DbClient = PostgresJsDatabase<typeof schema>

export function getDb(tx?: DbClient): DbClient {
  return tx ?? (defaultDb as unknown as DbClient)
}
