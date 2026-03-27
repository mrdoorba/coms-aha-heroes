import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

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
    const params = new URLSearchParams()
    params.set('type', data.type ?? 'bintang')
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 50))
    if (data.teamId) params.set('teamId', data.teamId)

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/leaderboard?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to load leaderboard')
    return { entries: result.data, meta: result.meta }
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
