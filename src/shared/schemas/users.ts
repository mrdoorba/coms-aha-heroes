import { z } from 'zod'
import { USER_ROLES } from '../constants'

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(USER_ROLES),
  branchId: z.string().uuid(),
  teamId: z.string().uuid().nullable().optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  role: z.enum(USER_ROLES).optional(),
  teamId: z.string().uuid().nullable().optional(),
  department: z.string().max(100).optional(),
  position: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
})

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(USER_ROLES).optional(),
  teamId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ListUsersInput = z.infer<typeof listUsersSchema>
