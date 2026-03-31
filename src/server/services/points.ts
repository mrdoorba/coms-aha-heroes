import { eq, and } from 'drizzle-orm'
import { pointCategories, users } from '~/db/schema'
import * as pointsRepo from '../repositories/points'
import { writeAuditLog } from './audit'
import { createNotification } from './notifications'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import { getDb } from '../repositories/base'
import type { SubmitPointInput, ListPointsInput } from '~/shared/schemas/points'
import type { PointCategoryCode } from '~/shared/constants'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function submitPoint(input: SubmitPointInput, ctx: ServiceContext) {
  const db = getDb(ctx.tx)

  // Resolve category by code
  const [category] = await db
    .select()
    .from(pointCategories)
    .where(eq(pointCategories.code, input.categoryCode))
    .limit(1)

  if (!category) {
    throw new CategoryNotFoundError(input.categoryCode)
  }

  if (!category.isActive) {
    throw new CategoryDisabledError(input.categoryCode)
  }

  // Validate target user exists and is active
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)

  if (!targetUser || !targetUser.isActive) {
    throw new TargetUserNotFoundError(input.userId)
  }

  // Screenshot required for Bintang and Penalti
  if (
    (input.categoryCode === 'BINTANG' || input.categoryCode === 'PENALTI') &&
    !input.screenshotUrl
  ) {
    throw new ScreenshotRequiredError(input.categoryCode)
  }

  // Self-submission restrictions
  const isSelfSubmission = ctx.actor.id === input.userId

  if (isSelfSubmission && input.categoryCode === 'PENALTI') {
    throw new SelfPenaltiError()
  }

  // Leaders cannot give Bintang/Poin AHA to themselves
  if (isSelfSubmission && ctx.actor.role === 'leader') {
    throw new LeaderSelfGiveError()
  }

  // Penalti can only be given by leader, hr, or admin
  if (
    input.categoryCode === 'PENALTI' &&
    ctx.actor.role === 'employee'
  ) {
    throw new InsufficientRoleForPenaltiError()
  }

  // Determine status based on role and submission type
  const status = resolveInitialStatus(ctx.actor.role, isSelfSubmission)

  const created = await pointsRepo.createPoint(
    {
      branchId: ctx.actor.branchId,
      userId: input.userId,
      categoryId: category.id,
      points: input.points,
      reason: input.reason,
      relatedStaff: input.relatedStaff ?? null,
      screenshotUrl: input.screenshotUrl ?? null,
      kittaComponent: input.kittaComponent ?? null,
      status,
      submittedBy: ctx.actor.id,
    },
    ctx.tx,
  )

  // Audit log
  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'POINT_SUBMITTED',
      entityType: 'achievement_points',
      entityId: created.id,
      newValue: {
        categoryCode: input.categoryCode,
        points: input.points,
        status,
        userId: input.userId,
        isSelfSubmission,
      },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  // Notifications
  if (status === 'pending') {
    // Notify the submitter that their submission is pending
    await createNotification(
      {
        branchId: ctx.actor.branchId,
        userId: ctx.actor.id,
        type: 'point_pending',
        title: `Your ${getCategoryLabel(input.categoryCode)} submission is pending approval`,
        entityType: 'achievement_points',
        entityId: created.id,
      },
      ctx.tx,
    )

    // Notify team leaders for approval
    if (targetUser.teamId) {
      const teamLeaders = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.teamId, targetUser.teamId),
            eq(users.role, 'leader'),
            eq(users.isActive, true),
          ),
        )

      for (const leader of teamLeaders) {
        await createNotification(
          {
            branchId: ctx.actor.branchId,
            userId: leader.id,
            type: 'point_needs_approval',
            title: `${ctx.actor.name} submitted ${getCategoryLabel(input.categoryCode)} — needs your approval`,
            entityType: 'achievement_points',
            entityId: created.id,
          },
          ctx.tx,
        )
      }
    }
  } else if (!isSelfSubmission) {
    // Notify the target user about the point they received
    await createNotification(
      {
        branchId: ctx.actor.branchId,
        userId: input.userId,
        type: 'point_received',
        title: `You received ${input.points} ${getCategoryLabel(input.categoryCode)} from ${ctx.actor.name}`,
        entityType: 'achievement_points',
        entityId: created.id,
      },
      ctx.tx,
    )
  }

  return { ...created, categoryCode: input.categoryCode, status }
}

export async function listPoints(input: ListPointsInput, ctx: ServiceContext) {
  const { rows, total } = await pointsRepo.listPoints(
    {
      page: input.page,
      limit: input.limit,
      categoryCode: input.categoryCode,
      status: input.status,
      userId: input.userId,
      teamId: input.teamId,
      search: input.search,
      submittedBy: input.submittedBy,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    },
    ctx.tx,
  )

  return {
    points: rows,
    meta: { total, page: input.page, limit: input.limit },
  }
}

export async function getPointById(id: string, ctx: ServiceContext) {
  const result = await pointsRepo.getPointWithDetails(id, ctx.tx)
  if (!result) {
    throw new PointNotFoundError(id)
  }

  // Also fetch submitter info
  const db = getDb(ctx.tx)
  const [submitter] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, result.point.submittedBy))
    .limit(1)

  return {
    ...result.point,
    category: result.category,
    user: result.user,
    submitter: submitter ?? null,
  }
}

function resolveInitialStatus(
  role: AuthUser['role'],
  isSelfSubmission: boolean,
): 'pending' | 'active' {
  // HR and Admin submissions are always immediately active
  if (role === 'admin' || role === 'hr') return 'active'

  // Leader submissions are active (unless self-submitting, which is blocked above)
  if (role === 'leader' && !isSelfSubmission) return 'active'

  // Employee self-submissions are pending leader approval
  return 'pending'
}

function getCategoryLabel(code: PointCategoryCode): string {
  const labels: Record<PointCategoryCode, string> = {
    BINTANG: 'Bintang sAHAbat',
    PENALTI: 'Penalti',
    POIN_AHA: 'Poin AHA',
  }
  return labels[code]
}

// Domain errors
export class CategoryNotFoundError extends Error {
  constructor(code: string) {
    super(`Category not found: ${code}`)
    this.name = 'CategoryNotFoundError'
  }
}

export class CategoryDisabledError extends Error {
  constructor(code: string) {
    super(`Category is disabled: ${code}`)
    this.name = 'CategoryDisabledError'
  }
}

export class TargetUserNotFoundError extends Error {
  constructor(id: string) {
    super(`Target user not found or inactive: ${id}`)
    this.name = 'TargetUserNotFoundError'
  }
}

export class ScreenshotRequiredError extends Error {
  constructor(code: string) {
    super(`Screenshot is required for ${code}`)
    this.name = 'ScreenshotRequiredError'
  }
}

export class SelfPenaltiError extends Error {
  constructor() {
    super('Cannot give Penalti to yourself')
    this.name = 'SelfPenaltiError'
  }
}

export class LeaderSelfGiveError extends Error {
  constructor() {
    super('Leaders cannot give points to themselves')
    this.name = 'LeaderSelfGiveError'
  }
}

export class InsufficientRoleForPenaltiError extends Error {
  constructor() {
    super('Only leaders, HR, or admins can give Penalti')
    this.name = 'InsufficientRoleForPenaltiError'
  }
}

export class PointNotFoundError extends Error {
  constructor(id: string) {
    super(`Point not found: ${id}`)
    this.name = 'PointNotFoundError'
  }
}
