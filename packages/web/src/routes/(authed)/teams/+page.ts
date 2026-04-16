import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch }) => {
  const result = await api.api.v1.teams.get({ query: { page: 1, limit: 100 }, fetch })
  return {
    teams: unwrap(result, 'Failed to load teams'),
  }
}
