import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '../api-client'

type LeaderboardParams = {
  type?: 'bintang' | 'poin_aha' | 'penalti'
  teamId?: string
  months?: number
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
        ...(data.months ? { months: data.months } : {}),
      } as any,
    })
    const res = unwrap(result, 'Failed to load leaderboard')
    return { entries: res.data, meta: res.meta }
  })
