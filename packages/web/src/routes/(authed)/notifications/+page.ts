import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch }) => {
  const result = await api.api.v1.notifications.get({ query: { page: 1, limit: 50 }, fetch })
  return {
    notifications: unwrap(result, 'Failed to load notifications'),
  }
}
