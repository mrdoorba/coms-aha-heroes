import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

type FileChallengeParams = {
  pointId: string
  reason: string
}

type ResolveChallengeParams = {
  challengeId: string
  status: string
  resolutionNote: string
}

type ListChallengesParams = {
  pointId: string
  page?: number
  limit?: number
}

export const listChallengesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListChallengesParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const params = new URLSearchParams()
    params.set('page', String(data.page ?? 1))
    params.set('limit', String(data.limit ?? 20))

    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/challenges?${params.toString()}`,
      {
        headers: { Cookie: request.headers.get('cookie') ?? '' },
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list challenges')
    return { challenges: result.data, meta: result.meta }
  })

export const fileChallengeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FileChallengeParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/points/${data.pointId}/challenges`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({ reason: data.reason }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to file challenge')
    return result.data
  })

export const resolveChallengeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ResolveChallengeParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const response = await fetch(
      `${getBaseUrl(request)}/api/v1/challenges/${data.challengeId}/resolve`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') ?? '',
        },
        body: JSON.stringify({
          status: data.status,
          resolutionNote: data.resolutionNote,
        }),
      },
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to resolve challenge')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
