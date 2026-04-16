import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ params, fetch }) => {
  const result = await api.api.v1.rewards({ id: params.id }).get({ fetch })
  return {
    reward: unwrap(result, 'Failed to load reward'),
  }
}
