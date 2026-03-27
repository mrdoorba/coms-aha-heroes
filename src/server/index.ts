import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { health } from './routes/health'
import { authRoute } from './routes/auth'
import { authMiddleware } from './middleware/auth'
import { rlsMiddleware } from './middleware/rls'

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

// Placeholder: v1 routes will be mounted here
// app.route('/v1', usersRoute)
// app.route('/v1', teamsRoute)
// app.route('/v1', pointsRoute)

export type AppType = typeof app

export { app }
