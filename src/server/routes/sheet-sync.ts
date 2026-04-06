import { Elysia, t } from 'elysia'
import { paginationQuery } from './_query'
import * as scheduler from '../services/sheet-sync-scheduler'
import * as repo from '../repositories/sheet-sync'
import type { AuthUser } from '../middleware/auth'

type Ctx = { authUser: AuthUser }

// Public route — Cloud Scheduler triggers this via OIDC + Cloud Run IAM invoker
export const sheetSyncTriggerRoute = new Elysia({ prefix: '/cron' })
  .post('/sheet-sync', async () => {
    const job = await scheduler.triggerManualSync()
    return { success: true, data: job, error: null }
  })

// Protected routes — admin only (inside auth group)
export const sheetSyncRoute = new Elysia({ prefix: '/sheet-sync' })

  // POST /trigger — admin manual trigger (also available via session auth)
  .post('/trigger', async ({ set, ...c }) => {
    const { authUser: actor } = c as unknown as Ctx

    if (actor.role !== 'admin') {
      set.status = 403
      return { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Admin access required' } }
    }

    const job = await scheduler.triggerManualSync(actor.id)
    return { success: true, data: job, error: null }
  })

  // GET /jobs — list sync job history (admin only)
  .get('/jobs', async ({ query, set, ...c }) => {
    const { authUser: actor } = c as unknown as Ctx

    if (actor.role !== 'admin') {
      set.status = 403
      return { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Admin access required' } }
    }

    const result = await repo.listJobs({ page: query.page, limit: query.limit })
    return {
      success: true,
      data: result.jobs,
      error: null,
      meta: result.meta,
    }
  }, { query: t.Object({ ...paginationQuery }) })

  // GET /jobs/:id — get single job by id (admin only)
  .get('/jobs/:id', async ({ params, set, ...c }) => {
    const { authUser: actor } = c as unknown as Ctx

    if (actor.role !== 'admin') {
      set.status = 403
      return { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Admin access required' } }
    }

    const job = await repo.getJobById(params.id)
    if (!job) {
      set.status = 404
      return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Sync job not found' } }
    }
    return { success: true, data: job, error: null }
  })

  // GET /status — get current sync status (admin only)
  .get('/status', async ({ set, ...c }) => {
    const { authUser: actor } = c as unknown as Ctx

    if (actor.role !== 'admin') {
      set.status = 403
      return { success: false, data: null, error: { code: 'FORBIDDEN', message: 'Admin access required' } }
    }

    const isRunning = scheduler.isSyncRunning()
    const lastJob = await repo.getLatestJob()

    return {
      success: true,
      data: {
        isRunning,
        lastJob,
        schedule: 'daily (6 AM WIB via Cloud Scheduler)',
      },
      error: null,
    }
  })
