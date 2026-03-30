import * as rewardsRepo from '../repositories/rewards'
import type { AuthUser } from '../middleware/auth'
import type { DbClient } from '../repositories/base'
import type { CreateRewardInput, UpdateRewardInput, ListRewardsInput } from '~/shared/schemas/rewards'

type ServiceContext = {
  readonly actor: AuthUser
  readonly tx: DbClient
  readonly ipAddress?: string
}

export async function listRewards(input: ListRewardsInput, ctx: ServiceContext) {
  const { rows, total } = await rewardsRepo.listRewards(
    { page: input.page, limit: input.limit },
    ctx.tx,
  )

  return {
    rewards: rows,
    meta: { total, page: input.page, limit: input.limit },
  }
}

export async function getRewardById(id: string, ctx: ServiceContext) {
  const reward = await rewardsRepo.getRewardById(id, ctx.tx)
  if (!reward) throw new RewardNotFoundError(id)
  return reward
}

export async function createReward(input: CreateRewardInput, ctx: ServiceContext) {
  if (ctx.actor.role !== 'hr' && ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }

  const created = await rewardsRepo.createReward(
    {
      branchId: ctx.actor.branchId,
      name: input.name,
      description: input.description,
      pointCost: input.pointCost,
      imageUrl: input.imageUrl,
    },
    ctx.tx,
  )

  return created
}

export async function updateReward(
  id: string,
  input: UpdateRewardInput,
  ctx: ServiceContext,
) {
  if (ctx.actor.role !== 'hr' && ctx.actor.role !== 'admin') {
    throw new InsufficientRoleError()
  }

  const reward = await rewardsRepo.getRewardById(id, ctx.tx)
  if (!reward) throw new RewardNotFoundError(id)

  const updated = await rewardsRepo.updateReward(id, input, ctx.tx)
  return updated
}

// Domain errors
export class RewardNotFoundError extends Error {
  constructor(id: string) {
    super(`Reward not found: ${id}`)
    this.name = 'RewardNotFoundError'
  }
}

export class InsufficientRoleError extends Error {
  constructor() {
    super('Insufficient role for this action')
    this.name = 'InsufficientRoleError'
  }
}
