import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'

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
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).challenges.get({
      query: { page: data.page ?? 1, limit: data.limit ?? 20 } as any,
    })
    const res = unwrap(result, 'Failed to list challenges')
    return { challenges: res.data, meta: res.meta }
  })

export const fileChallengeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FileChallengeParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.points({ id: data.pointId }).challenges.post(
      { reason: data.reason } as any,
    )
    const res = unwrap(result, 'Failed to file challenge')
    return res.data
  })

export const resolveChallengeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: ResolveChallengeParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.challenges({ id: data.challengeId }).resolve.patch({
      status: data.status,
      resolutionNote: data.resolutionNote,
    } as any)
    const res = unwrap(result, 'Failed to resolve challenge')
    return res.data
  })
