import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { setResponseHeader } from '@tanstack/react-start/server'

type Theme = 'light' | 'dark'

const COOKIE_NAME = 'aha-theme'
const MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export const getThemeFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const cookie = request.headers.get('cookie') ?? ''
    const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
    const value = match?.[1]
    return value === 'dark' ? 'dark' : 'light'
  },
)

export const setThemeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { theme: Theme }) => data)
  .handler(async ({ data }) => {
    setResponseHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${data.theme}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax`,
    )
    return data.theme
  })
