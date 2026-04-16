import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch }) => {
  const result = await api.api.v1.rewards.get({ query: { page: 1, limit: 100 }, fetch })
  return {
    rewards: unwrap(result, 'Failed to load rewards'),
  }
}
