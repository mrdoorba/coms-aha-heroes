import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

type LeaderboardParams = {
  type?: 'bintang' | 'poin_aha'
  teamId?: string
  page?: number
  limit?: number
}

export const getLeaderboardFn = createServerFn({ method: 'GET' })
  .inputValidator((data: LeaderboardParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.leaderboard.get({
      query: {
        type: data.type ?? 'bintang',
        page: data.page ?? 1,
        limit: data.limit ?? 50,
        ...(data.teamId ? { teamId: data.teamId } : {}),
      } as any,
    })
    const res = unwrap(result, 'Failed to load leaderboard')
    return { entries: res.data, meta: res.meta }
  })
