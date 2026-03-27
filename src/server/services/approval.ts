import * as pointsRepo from '../repositories/points'
import { writeAuditLog } from './audit'
import { createNotification } from './notifications'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { ApproveRejectInput } from '~/shared/schemas/points'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function approvePoint(
  id: string,
  input: ApproveRejectInput,
  ctx: ServiceContext,
) {
  const result = await pointsRepo.getPointWithDetails(id, ctx.tx)
  if (!result) throw new PointNotFoundError(id)

  const { point, category, user: targetUser } = result

  if (point.status !== 'pending') throw new PointNotPendingError(id)

  assertCanApproveReject(ctx.actor, targetUser)

  const now = new Date()
  const updated = await pointsRepo.updatePointStatus(
    id,
    { status: 'active', approvedBy: ctx.actor.id, approvedAt: now },
    ctx.tx,
  )

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'POINT_APPROVED',
      entityType: 'achievement_points',
      entityId: id,
      newValue: { status: 'active', reason: input.reason ?? null },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  const categoryLabel = category.defaultName

  await createNotification(
    {
      branchId: ctx.actor.branchId,
      userId: targetUser.id,
      type: 'point_approved',
      title: `Your ${categoryLabel} submission has been approved`,
      entityType: 'achievement_points',
      entityId: id,
    },
    ctx.tx,
  )

  if (point.submittedBy !== targetUser.id) {
    await createNotification(
      {
        branchId: ctx.actor.branchId,
        userId: point.submittedBy,
        type: 'point_approved',
        title: `Your ${categoryLabel} submission has been approved`,
        entityType: 'achievement_points',
        entityId: id,
      },
      ctx.tx,
    )
  }

  return updated
}

export async function rejectPoint(
  id: string,
  input: ApproveRejectInput,
  ctx: ServiceContext,
) {
  const result = await pointsRepo.getPointWithDetails(id, ctx.tx)
  if (!result) throw new PointNotFoundError(id)

  const { point, category, user: targetUser } = result

  if (point.status !== 'pending') throw new PointNotPendingError(id)

  assertCanApproveReject(ctx.actor, targetUser)

  const now = new Date()
  const updated = await pointsRepo.updatePointStatus(
    id,
    { status: 'rejected', approvedBy: ctx.actor.id, approvedAt: now },
    ctx.tx,
  )

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'POINT_REJECTED',
      entityType: 'achievement_points',
      entityId: id,
      newValue: { status: 'rejected', reason: input.reason ?? null },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  const categoryLabel = category.defaultName
  const rejectionSuffix = input.reason ? `: ${input.reason}` : ''

  await createNotification(
    {
      branchId: ctx.actor.branchId,
      userId: targetUser.id,
      type: 'point_rejected',
      title: `Your ${categoryLabel} submission has been rejected${rejectionSuffix}`,
      entityType: 'achievement_points',
      entityId: id,
    },
    ctx.tx,
  )

  if (point.submittedBy !== targetUser.id) {
    await createNotification(
      {
        branchId: ctx.actor.branchId,
        userId: point.submittedBy,
        type: 'point_rejected',
        title: `Your ${categoryLabel} submission has been rejected${rejectionSuffix}`,
        entityType: 'achievement_points',
        entityId: id,
      },
      ctx.tx,
    )
  }

  return updated
}

function assertCanApproveReject(
  actor: AuthUser,
  targetUser: { id: string; teamId: string | null },
) {
  if (actor.role === 'employee') {
    throw new UnauthorizedApprovalError('Employees cannot approve or reject points')
  }

  if (actor.role === 'leader') {
    if (!actor.teamId || actor.teamId !== targetUser.teamId) {
      throw new UnauthorizedApprovalError(
        'Leaders can only approve or reject points for users in their own team',
      )
    }
  }
}

// Domain errors
export class PointNotFoundError extends Error {
  constructor(id: string) {
    super(`Point not found: ${id}`)
    this.name = 'PointNotFoundError'
  }
}

export class PointNotPendingError extends Error {
  constructor(id: string) {
    super(`Point is not pending approval: ${id}`)
    this.name = 'PointNotPendingError'
  }
}

export class UnauthorizedApprovalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedApprovalError'
  }
}
