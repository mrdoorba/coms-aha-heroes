import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  branchId: z.string().uuid(),
  leaderId: z.string().uuid().nullable().optional(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  leaderId: z.string().uuid().nullable().optional(),
})

export const listTeamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type ListTeamsInput = z.infer<typeof listTeamsSchema>
