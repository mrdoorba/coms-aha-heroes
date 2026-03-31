import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi } from '~/lib/api-client'

export const getUnreadCountFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.notifications['unread-count'].get()
    if (result.error) return { count: 0 }
    return { count: (result.data as any)?.data?.count ?? 0 }
  },
)
