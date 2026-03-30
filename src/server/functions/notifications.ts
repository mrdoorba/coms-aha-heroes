import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

export const getUnreadCountFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const res = await fetch(
      new URL('/api/v1/notifications/unread-count', request.url).href,
      { headers: request.headers },
    )

    if (!res.ok) return { count: 0 }

    const data = (await res.json()) as { count?: number }
    return { count: data.count ?? 0 }
  },
)
