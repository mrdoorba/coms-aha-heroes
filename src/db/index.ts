import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Extract ?host= for Unix socket connections (Cloud SQL via /cloudsql/).
// postgres.js ignores the host query param when a URL hostname is present
// and splits host strings on colons (breaking Cloud SQL socket paths like
// /cloudsql/project:region:instance). Arrays bypass both issues.
const parsedUrl = new URL(connectionString)
const socketHost = parsedUrl.searchParams.get('host')

const pgOptions: Parameters<typeof postgres>[1] = {
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 1800,
}

if (socketHost?.startsWith('/')) {
  pgOptions.host = [socketHost]
  pgOptions.port = [5432]
}

console.log('[db] socketHost:', socketHost)
console.log('[db] pgOptions.host:', pgOptions.host)

const client = postgres(connectionString, pgOptions)

console.log('[db] postgres options.host:', client.options?.host)

export const db = drizzle(client, { schema })
