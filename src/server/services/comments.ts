import { achievementPoints, challenges, appeals } from '~/db/schema'
import { eq } from 'drizzle-orm'
import * as commentsRepo from '../repositories/comments'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import { getDb } from '../repositories/base'
import type { CreateCommentInput, UpdateCommentInput, ListCommentsInput } from '~/shared/schemas/comments'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
}

const ENTITY_TABLE_MAP = {
  achievement: achievementPoints,
  challenge: challenges,
  appeal: appeals,
} as const

export async function createComment(
  input: CreateCommentInput,
  ctx: ServiceContext,
) {
  // Validate entity exists
  const table = ENTITY_TABLE_MAP[input.entityType]
  const db = getDb(ctx.tx)
  const [entity] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, input.entityId))
    .limit(1)

  if (!entity) throw new EntityNotFoundError(input.entityType, input.entityId)

  const created = await commentsRepo.create(
    {
      branchId: ctx.actor.branchId,
      entityType: input.entityType,
      entityId: input.entityId,
      authorId: ctx.actor.id,
      body: input.body,
    },
    ctx.tx,
  )

  return created
}

export async function updateComment(
  commentId: string,
  input: UpdateCommentInput,
  ctx: ServiceContext,
) {
  const comment = await commentsRepo.getById(commentId, ctx.tx)
  if (!comment) throw new CommentNotFoundError(commentId)

  if (comment.authorId !== ctx.actor.id) throw new NotCommentAuthorError()

  const updated = await commentsRepo.update(commentId, input.body, ctx.tx)
  return updated
}

export async function listComments(
  input: ListCommentsInput,
  ctx: ServiceContext,
) {
  const { rows, total } = await commentsRepo.listByEntity(
    {
      entityType: input.entityType,
      entityId: input.entityId,
      page: input.page,
      limit: input.limit,
    },
    ctx.tx,
  )

  return {
    comments: rows,
    meta: { total, page: input.page, limit: input.limit },
  }
}

// Domain errors
export class EntityNotFoundError extends Error {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`)
    this.name = 'EntityNotFoundError'
  }
}

export class CommentNotFoundError extends Error {
  constructor(id: string) {
    super(`Comment not found: ${id}`)
    this.name = 'CommentNotFoundError'
  }
}

export class NotCommentAuthorError extends Error {
  constructor() {
    super('Only the comment author can edit this comment')
    this.name = 'NotCommentAuthorError'
  }
}
