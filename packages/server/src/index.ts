import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { health } from './routes/health'
import { healthz } from './routes/healthz'
import { authRoute } from './routes/auth'
import { authPlugin } from './middleware/auth'
import { errorHandler } from './middleware/error-handler'
import { apiCacheControl } from './middleware/cache-control'
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

const app = new Elysia()
  .onError(errorHandler)
  .use(
    cors({
      origin: true,
      credentials: true,
    }),
  )
  // API routes
  .group('/api', (api) =>
    api
      .use(apiCacheControl)
      .use(health)
      .use(healthz)
      .use(authRoute)
      .use(sheetSyncTriggerRoute)
      .group('/v1', (v1) =>
        v1
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
      ),
  )

// SvelteKit handler mount placeholder (added in Task 8)

export type App = typeof app

const port = Number(process.env.PORT) || 8080

app.listen(port, () => {
  console.log(`[server] listening on :${port}`)
})

export { app }
