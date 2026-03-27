import { z } from 'zod'
import { CHALLENGE_STATUSES } from '../constants'

const resolvableStatuses = CHALLENGE_STATUSES.filter((s) => s !== 'open') as [
  string,
  ...string[],
]

export const fileChallengeSchema = z.object({
  reason: z.string().min(1).max(2000),
})

export const resolveChallengeSchema = z.object({
  status: z.enum(resolvableStatuses),
  resolutionNote: z.string().min(1).max(2000),
})

export const listChallengesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type FileChallengeInput = z.infer<typeof fileChallengeSchema>
export type ResolveChallengeInput = z.infer<typeof resolveChallengeSchema>
export type ListChallengesInput = z.infer<typeof listChallengesSchema>
