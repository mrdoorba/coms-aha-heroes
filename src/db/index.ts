import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Extract ?host= for Unix socket connections (Cloud SQL via /cloudsql/).
// postgres.js ignores the host query param when a URL hostname is present
// and splits host strings on colons (breaking Cloud SQL socket paths like
// /cloudsql/project:region:instance). Arrays bypass both issues.
const url = new URL(connectionString)
const socketHost = url.searchParams.get('host')

const client = postgres(connectionString, {
  ...(socketHost?.startsWith('/') && { host: [socketHost], port: [5432] }),
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 1800,
})

export const db = drizzle(client, { schema })
