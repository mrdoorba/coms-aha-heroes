import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { users } from '~/db/schema'
import { eq, asc } from 'drizzle-orm'

type ListTeamsParams = {
  page?: number
  limit?: number
  search?: string
}

export const listTeamsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListTeamsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.teams.get({
      query: {
        page: data.page ?? 1,
        limit: data.limit ?? 20,
        ...(data.search ? { search: data.search } : {}),
      } as any,
    })
    const res = unwrap(result, 'Failed to list teams')
    return { teams: res.data, meta: res.meta }
  })

export const getTeamByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.teams({ id: data.id }).get()
    const res = unwrap(result, 'Failed to get team')
    return res.data
  })

// Pattern B — Direct DB access (no API call)
export const getLookupDataFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const leaderCandidates = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(asc(users.name))

    return { users: leaderCandidates }
  },
)

export const createTeamFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      name: string
      branchId: string
      leaderId?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.teams.post(data as any)
    const res = unwrap(result, 'Failed to create team')
    return res.data
  })

export const updateTeamFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      name?: string
      leaderId?: string | null
    }) => data,
  )
  .handler(async ({ data }) => {
    const { id, ...body } = data
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.teams({ id }).patch(body as any)
    const res = unwrap(result, 'Failed to update team')
    return res.data
  })
