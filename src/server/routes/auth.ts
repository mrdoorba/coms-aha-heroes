import { Hono } from 'hono'
import { auth } from '../auth'

const authRoute = new Hono()

authRoute.on(['POST', 'GET'], '/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

export { authRoute }
