import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Extract ?host= for Unix socket connections (Cloud SQL via /cloudsql/).
// postgres.js ignores the host query param when a URL hostname is present,
// so we pull it out and pass it as an explicit option.
const url = new URL(connectionString)
const socketHost = url.searchParams.get('host')

const client = postgres(connectionString, {
  ...(socketHost?.startsWith('/') && { host: socketHost }),
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 1800,
})

export const db = drizzle(client, { schema })
