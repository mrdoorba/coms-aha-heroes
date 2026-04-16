import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch }) => {
  const result = await api.api.v1.redemptions.get({
    query: { page: 1, limit: 50, mine: true },
    fetch,
  })
  return {
    redemptions: unwrap(result, 'Failed to load redemptions'),
  }
}
