import type { PageLoad } from './$types'
import { api, unwrap } from '$lib/api/client'

export const load: PageLoad = async ({ fetch, url }) => {
  const page = Number(url.searchParams.get('page') ?? '1')
  const status = url.searchParams.get('status') ?? undefined

  const result = await api.api.v1.points.get({
    query: {
      page,
      limit: 20,
      ...(status ? { status: status as any } : {}),
    },
    fetch,
  })

  return {
    points: unwrap(result, 'Failed to load points'),
    meta: result.data?.meta ?? { total: 0, page: 1, limit: 20 },
    status: status ?? '',
  }
}
