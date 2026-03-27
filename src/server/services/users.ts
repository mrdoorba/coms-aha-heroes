import { auth } from '../auth'
import * as usersRepo from '../repositories/users'
import { writeAuditLog } from './audit'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersInput,
} from '~/shared/schemas/users'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function listUsers(input: ListUsersInput, ctx: ServiceContext) {
  const { rows, total } = await usersRepo.listUsers(
    {
      page: input.page,
      limit: input.limit,
      role: input.role,
      teamId: input.teamId,
      search: input.search,
      isActive: input.isActive,
    },
    ctx.tx,
  )

  return {
    users: rows,
    meta: { total, page: input.page, limit: input.limit },
  }
}

export async function getUserById(id: string, ctx: ServiceContext) {
  const user = await usersRepo.getUserById(id, ctx.tx)
  if (!user) {
    throw new UserNotFoundError(id)
  }
  return user
}

export async function createUser(input: CreateUserInput, ctx: ServiceContext) {
  const existing = await usersRepo.getUserByEmail(input.email, ctx.tx)
  if (existing) {
    throw new EmailAlreadyExistsError(input.email)
  }

  const created = await usersRepo.createUser(
    {
      email: input.email,
      name: input.name,
      role: input.role,
      branchId: input.branchId,
      teamId: input.teamId ?? null,
      department: input.department ?? null,
      position: input.position ?? null,
    },
    ctx.tx,
  )

  // Create Better Auth account so the user can log in
  // Default password = changeme123 — mustChangePassword is true by default
  try {
    await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: 'changeme123',
        name: input.name,
      },
    })
  } catch {
    // Better Auth account may already exist if re-creating a previously archived user
  }

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'USER_CREATED',
      entityType: 'users',
      entityId: created.id,
      newValue: { email: created.email, role: created.role, name: created.name },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  return created
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  ctx: ServiceContext,
) {
  const existing = await usersRepo.getUserById(id, ctx.tx)
  if (!existing) {
    throw new UserNotFoundError(id)
  }

  const updated = await usersRepo.updateUser(id, input, ctx.tx)
  if (!updated) {
    throw new UserNotFoundError(id)
  }

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'USER_UPDATED',
      entityType: 'users',
      entityId: id,
      oldValue: {
        name: existing.name,
        role: existing.role,
        teamId: existing.teamId,
        department: existing.department,
        position: existing.position,
      },
      newValue: input,
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  return updated
}

export async function archiveUser(id: string, ctx: ServiceContext) {
  if (id === ctx.actor.id) {
    throw new CannotArchiveSelfError()
  }

  const existing = await usersRepo.getUserById(id, ctx.tx)
  if (!existing) {
    throw new UserNotFoundError(id)
  }

  if (!existing.isActive) {
    throw new UserAlreadyArchivedError(id)
  }

  const archived = await usersRepo.archiveUser(id, ctx.tx)

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'USER_ARCHIVED',
      entityType: 'users',
      entityId: id,
      oldValue: { isActive: true },
      newValue: { isActive: false, archivedAt: archived?.archivedAt },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  return archived
}

// Domain errors
export class UserNotFoundError extends Error {
  constructor(id: string) {
    super(`User not found: ${id}`)
    this.name = 'UserNotFoundError'
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`Email already in use: ${email}`)
    this.name = 'EmailAlreadyExistsError'
  }
}

export class CannotArchiveSelfError extends Error {
  constructor() {
    super('Cannot archive your own account')
    this.name = 'CannotArchiveSelfError'
  }
}

export class UserAlreadyArchivedError extends Error {
  constructor(id: string) {
    super(`User already archived: ${id}`)
    this.name = 'UserAlreadyArchivedError'
  }
}
