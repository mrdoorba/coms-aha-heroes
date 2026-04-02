import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

// Cloud SQL Unix sockets: the ?host= query param contains the socket dir
// (e.g. /cloudsql/project:region:instance). postgres.js can't handle this
// natively — it ignores ?host= when a URL hostname exists, splits on colons,
// and its array-host path detection uses Array.indexOf('/') which fails.
// We bypass all of this by setting the socket path directly.
const parsedUrl = new URL(connectionString)
const socketDir = parsedUrl.searchParams.get('host')

// Remove ?host= so postgres.js doesn't forward it as a server parameter
if (socketDir) parsedUrl.searchParams.delete('host')
const cleanedUrl = parsedUrl.toString()

const client = postgres(cleanedUrl, {
  ...(socketDir?.startsWith('/') && {
    path: socketDir + '/.s.PGSQL.5432',
  }),
  max: Number(process.env.DB_POOL_MAX) || 9,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 1800,
})

export const db = drizzle(client, { schema })
