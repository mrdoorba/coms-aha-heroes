import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { teams, users } from '~/db/schema'
import { eq, and, count, asc } from 'drizzle-orm'

type ListTeamsParams = {
  page?: number
  limit?: number
  search?: string
}

export const listTeamsFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListTeamsParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const qs = new URLSearchParams()
    qs.set('page', String(data.page ?? 1))
    qs.set('limit', String(data.limit ?? 20))
    if (data.search) qs.set('search', data.search)

    const response = await fetch(`${getBaseUrl(request)}/api/v1/teams?${qs}`, {
      headers: { Cookie: request.headers.get('cookie') ?? '' },
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to list teams')
    return { teams: result.data, meta: result.meta }
  })

export const getTeamByIdFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${getBaseUrl(request)}/api/v1/teams/${data.id}`, {
      headers: { Cookie: request.headers.get('cookie') ?? '' },
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to get team')
    return result.data
  })

export const getLookupDataFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    // Get users who can be leaders (leaders, hr, admin)
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
    const response = await fetch(`${getBaseUrl(request)}/api/v1/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to create team')
    return result.data
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
    const response = await fetch(`${getBaseUrl(request)}/api/v1/teams/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Failed to update team')
    return result.data
  })

function getBaseUrl(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
