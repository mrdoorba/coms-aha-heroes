import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { health } from './routes/health'

const app = new Hono().basePath('/api')

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
)

app.route('/', health)

export type AppType = typeof app

export { app }
