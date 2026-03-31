import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createServerApi, unwrap } from '~/lib/api-client'
import { auth } from '~/server/auth'
import { db } from '~/db'
import { users, branches, teams } from '~/db/schema'
import { eq, and, ilike, count, asc } from 'drizzle-orm'
import type { UserRole } from '~/shared/constants'

type ListUsersParams = {
  page?: number
  limit?: number
  role?: string
  teamId?: string
  search?: string
  isActive?: boolean
  department?: string
  position?: string
  branchId?: string
}

// Pattern B — Direct DB access (no API call)
export const listUsersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: ListUsersParams) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const page = data.page ?? 1
    const limit = data.limit ?? 20
    const offset = (page - 1) * limit
    const conditions = []

    if (data.role) conditions.push(eq(users.role, data.role as UserRole))
    if (data.teamId) conditions.push(eq(users.teamId, data.teamId))
    if (data.isActive !== undefined) conditions.push(eq(users.isActive, data.isActive))
    if (data.search) conditions.push(ilike(users.name, `%${data.search}%`))
    if (data.department) conditions.push(ilike(users.department, `%${data.department}%`))
    if (data.position) conditions.push(ilike(users.position, `%${data.position}%`))
    if (data.branchId) conditions.push(eq(users.branchId, data.branchId))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          department: users.department,
          position: users.position,
          teamId: users.teamId,
          branchId: users.branchId,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(asc(users.name))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(users).where(where),
    ])

    return { users: rows, meta: { total, page, limit } }
  })

// Pattern B — Direct DB access (no API call)
export const getLookupDataFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const request = getRequest()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) throw new Error('Not authenticated')

    const [branchRows, teamRows] = await Promise.all([
      db.select({ id: branches.id, name: branches.name }).from(branches).orderBy(asc(branches.name)),
      db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(asc(teams.name)),
    ])

    return { branches: branchRows, teams: teamRows }
  },
)

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      email: string
      name: string
      role: string
      branchId: string
      teamId?: string | null
      department?: string
      position?: string
      phone?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.users.post(data as any)
    const res = unwrap(result, 'Failed to create user')
    return res.data
  })

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      name?: string
      role?: string
      teamId?: string | null
      department?: string
      position?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { id, ...body } = data
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.users({ id }).patch(body as any)
    const res = unwrap(result, 'Failed to update user')
    return res.data
  })

export const archiveUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.users({ id: data.id }).archive.patch({} as any)
    const res = unwrap(result, 'Failed to archive user')
    return res.data
  })

export const bulkToggleUsersFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { ids: string[]; action: 'archive' | 'activate' }) => data)
  .handler(async ({ data }) => {
    const request = getRequest()
    const api = createServerApi(request)

    const result = await api.api.v1.users.bulk.post(data as any)
    const res = unwrap(result, 'Failed to bulk update users')
    return res.data
  })
