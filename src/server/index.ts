import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { health } from './routes/health'
import { authRoute } from './routes/auth'
import { authMiddleware } from './middleware/auth'
import { rlsMiddleware } from './middleware/rls'
import { usersRoute } from './routes/users'

const app = new Hono().basePath('/api')

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
// app.route('/v1', teamsRoute)
// app.route('/v1', pointsRoute)

export type AppType = typeof app

export { app }
