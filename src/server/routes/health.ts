import { Hono } from 'hono'
import { db } from '~/db'
import { sql } from 'drizzle-orm'
import type { ApiResult } from '~/shared/types/api'

type HealthData = {
  status: 'ok' | 'degraded'
  timestamp: string
  db: 'connected' | 'disconnected'
}

const health = new Hono().get('/health', async (c) => {
  let dbStatus: HealthData['db'] = 'disconnected'

  try {
    await db.execute(sql`SELECT 1`)
    dbStatus = 'connected'
  } catch {
    // DB unreachable — report degraded
  }

  const data: HealthData = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  }

  const response: ApiResult<HealthData> = {
    success: true,
    data,
    error: null,
  }

  return c.json(response, dbStatus === 'connected' ? 200 : 503)
})

export { health }
