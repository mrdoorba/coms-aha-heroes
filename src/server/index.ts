import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { health } from './routes/health'
import { authRoute } from './routes/auth'
import { authMiddleware } from './middleware/auth'
import { rlsMiddleware } from './middleware/rls'
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
import { errorHandler } from './middleware/error-handler'

const app = new Hono().basePath('/api')
app.onError(errorHandler)

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
)

// Public routes (no auth required)
app.route('/', health)
app.route('/', authRoute)

// Protected routes — auth + RLS middleware chain
app.use('/v1/*', authMiddleware)
app.use('/v1/*', rlsMiddleware)

// v1 routes
app.route('/v1/users', usersRoute)
app.route('/v1/teams', teamsRoute)
app.route('/v1/categories', categoriesRoute)
app.route('/v1/points', pointsRoute)
app.route('/v1/uploads', uploadsRoute)
app.route('/v1/leaderboard', leaderboardRoute)
app.route('/v1/notifications', notificationsRoute)
app.route('/v1/dashboard', dashboardRoute)
app.route('/v1', challengesRoute)
app.route('/v1', appealsRoute)
app.route('/v1/comments', commentsRoute)

export type AppType = typeof app

export { app }
