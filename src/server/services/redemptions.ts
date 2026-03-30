import { eq, and } from 'drizzle-orm'
import { rewards, users } from '~/db/schema'
import * as redemptionsRepo from '../repositories/redemptions'
import { writeAuditLog } from './audit'
import { createNotification } from './notifications'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import { getDb } from '../repositories/base'
import type {
  RequestRedemptionInput,
  ListRedemptionsInput,
  ResolveRedemptionInput,
} from '~/shared/schemas/redemptions'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function requestRedemption(
  input: RequestRedemptionInput,
  ctx: ServiceContext,
) {
  const db = getDb(ctx.tx)

  const [reward] = await db
    .select()
    .from(rewards)
    .where(eq(rewards.id, input.rewardId))
    .limit(1)

  if (!reward) throw new RewardNotFoundError(input.rewardId)
  if (!reward.isActive) throw new RewardNotActiveError(input.rewardId)

  const created = await redemptionsRepo.createRedemption(
    {
      branchId: ctx.actor.branchId,
      userId: ctx.actor.id,
      rewardId: input.rewardId,
      pointsSpent: reward.pointCost,
      notes: input.notes ?? null,
      status: 'pending',
    },
    ctx.tx,
  )

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'REDEMPTION_REQUESTED',
      entityType: 'redemptions',
      entityId: created.id,
      newValue: {
        rewardId: input.rewardId,
        pointsSpent: reward.pointCost,
        notes: input.notes,
      },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  return created
}

export async function listRedemptions(
  input: ListRedemptionsInput,
  ctx: ServiceContext,
) {
  const forceOwn = ctx.actor.role === 'employee'
  const filterByUser = forceOwn || input.mine ? ctx.actor.id : undefined

  const { rows, total } = await redemptionsRepo.listRedemptions(
    { page: input.page, limit: input.limit },
    { status: input.status, userId: filterByUser },
    ctx.tx,
  )

  return {
    redemptions: rows,
    meta: { total, page: input.page, limit: input.limit },
  }
}

export async function getRedemptionById(id: string, ctx: ServiceContext) {
  const redemption = await redemptionsRepo.getRedemptionById(id, ctx.tx)
  if (!redemption) throw new RedemptionNotFoundError(id)
  return redemption
}

export async function approveRedemption(id: string, ctx: ServiceContext) {
  if (ctx.actor.role !== 'hr' && ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }

  const redemption = await redemptionsRepo.getRedemptionById(id, ctx.tx)
  if (!redemption) throw new RedemptionNotFoundError(id)
  if (redemption.status !== 'pending') throw new RedemptionNotPendingError(id)

  const now = new Date()
  const updated = await redemptionsRepo.updateRedemptionStatus(
    id,
    {
      status: 'approved',
      approvedBy: ctx.actor.id,
      approvedAt: now,
    },
    ctx.tx,
  )

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'REDEMPTION_APPROVED',
      entityType: 'redemptions',
      entityId: id,
      newValue: { status: 'approved', approvedBy: ctx.actor.id },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  await createNotification(
    {
      branchId: redemption.branchId,
      userId: redemption.userId,
      type: 'redemption_approved',
      title: `Your redemption request for "${redemption.rewardName}" has been approved`,
      entityType: 'redemptions',
      entityId: id,
    },
    ctx.tx,
  )

  return updated
}

export async function rejectRedemption(
  id: string,
  input: ResolveRedemptionInput,
  ctx: ServiceContext,
) {
  if (ctx.actor.role !== 'hr' && ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }

  const redemption = await redemptionsRepo.getRedemptionById(id, ctx.tx)
  if (!redemption) throw new RedemptionNotFoundError(id)
  if (redemption.status !== 'pending') throw new RedemptionNotPendingError(id)

  const updated = await redemptionsRepo.updateRedemptionStatus(
    id,
    {
      status: 'rejected',
      rejectionReason: input.rejectionReason,
    },
    ctx.tx,
  )

  await writeAuditLog(
    {
      actor: ctx.actor,
      action: 'REDEMPTION_REJECTED',
      entityType: 'redemptions',
      entityId: id,
      newValue: {
        status: 'rejected',
        rejectionReason: input.rejectionReason,
      },
      ipAddress: ctx.ipAddress,
    },
    ctx.tx,
  )

  await createNotification(
    {
      branchId: redemption.branchId,
      userId: redemption.userId,
      type: 'redemption_rejected',
      title: `Your redemption request for "${redemption.rewardName}" has been rejected`,
      entityType: 'redemptions',
      entityId: id,
    },
    ctx.tx,
  )

  return updated
}

// Domain errors
export class RewardNotFoundError extends Error {
  constructor(id: string) {
    super(`Reward not found: ${id}`)
    this.name = 'RewardNotFoundError'
  }
}

export class RewardNotActiveError extends Error {
  constructor(id: string) {
    super(`Reward is not active: ${id}`)
    this.name = 'RewardNotActiveError'
  }
}

export class InsufficientBalanceError extends Error {
  constructor(required: number, available: number) {
    super(`Insufficient balance: required ${required}, available ${available}`)
    this.name = 'InsufficientBalanceError'
  }
}

export class RedemptionNotFoundError extends Error {
  constructor(id: string) {
    super(`Redemption not found: ${id}`)
    this.name = 'RedemptionNotFoundError'
  }
}

export class RedemptionNotPendingError extends Error {
  constructor(id: string) {
    super(`Redemption is not pending: ${id}`)
    this.name = 'RedemptionNotPendingError'
  }
}

export class InsufficientRoleError extends Error {
  constructor() {
    super('Insufficient role for this action')
    this.name = 'InsufficientRoleError'
  }
}
