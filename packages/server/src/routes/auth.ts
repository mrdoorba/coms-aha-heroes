import { Elysia } from 'elysia'
import { auth } from '../auth'

export const authRoute = new Elysia().all('/auth/*', ({ request }) => {
  return auth.handler(request)
})
