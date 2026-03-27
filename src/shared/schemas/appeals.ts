import { z } from 'zod'
import { APPEAL_STATUSES } from '../constants'

const resolvableStatuses = APPEAL_STATUSES.filter((s) => s !== 'open') as [
  string,
  ...string[],
]

export const fileAppealSchema = z.object({
  reason: z.string().min(1).max(2000),
})

export const resolveAppealSchema = z.object({
  status: z.enum(resolvableStatuses),
  resolutionNote: z.string().min(1).max(2000),
})

export const listAppealsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type FileAppealInput = z.infer<typeof fileAppealSchema>
export type ResolveAppealInput = z.infer<typeof resolveAppealSchema>
export type ListAppealsInput = z.infer<typeof listAppealsSchema>
