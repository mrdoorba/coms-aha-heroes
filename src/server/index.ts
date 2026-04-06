import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { health } from './routes/health'
import { healthz } from './routes/healthz'
import { authRoute } from './routes/auth'
import { authPlugin } from './middleware/auth'
// RLS is now handled per-query via withRLS() in repositories/base.ts
import { errorHandler } from './middleware/error-handler'
import { usersRoute } from './routes/users'
import { teamsRoute } from './routes/teams'
import { categoriesRoute } from './routes/categories'
import { pointsRoute } from './routes/points'
import { uploadsRoute } from './routes/uploads'
import { leaderboardRoute } from './routes/leaderboard'
import { notificationsRoute } from './routes/notifications'
import { dashboardRoute } from './routes/dashboard'
import { challengesRoute } from './routes/challenges'
import { appealsRoute } from './routes/appeals'
import { commentsRoute } from './routes/comments'
import { rewardsRoute } from './routes/rewards'
import { redemptionsRoute } from './routes/redemptions'
import { settingsRoute } from './routes/settings'
import { auditLogsRoute } from './routes/audit-logs'
import { reportsRoute } from './routes/reports'
import { sheetSyncRoute, sheetSyncTriggerRoute } from './routes/sheet-sync'

const app = new Elysia({ prefix: '/api' })
  .onError(errorHandler)
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  // Public routes (no auth required)
  .use(health)
  .use(healthz)
  .use(authRoute)
  .use(sheetSyncTriggerRoute)
  // Protected routes — auth + RLS middleware chain
  .group('/v1', (app) =>
    app
      .use(authPlugin)
      .use(usersRoute)
      .use(teamsRoute)
      .use(categoriesRoute)
      .use(pointsRoute)
      .use(uploadsRoute)
      .use(leaderboardRoute)
      .use(notificationsRoute)
      .use(dashboardRoute)
      .use(challengesRoute)
      .use(appealsRoute)
      .use(commentsRoute)
      .use(rewardsRoute)
      .use(redemptionsRoute)
      .use(settingsRoute)
      .use(auditLogsRoute)
      .use(reportsRoute)
      .use(sheetSyncRoute),
  )

export type App = typeof app

export { app }
