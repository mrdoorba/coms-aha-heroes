import { Type as t, type Static } from '@sinclair/typebox'

export const loginSchema = t.Object({
  email: t.String({ format: 'email' }),
  password: t.String({ minLength: 8, maxLength: 128 }),
})

// Note: cross-field validation (confirmPassword === newPassword) must be
// checked at the handler level — TypeBox has no .refine() equivalent.
export const changePasswordSchema = t.Object({
  currentPassword: t.String({ minLength: 1 }),
  newPassword: t.String({ minLength: 8, maxLength: 128 }),
  confirmPassword: t.String({ minLength: 1 }),
})

export type LoginInput = Static<typeof loginSchema>
export type ChangePasswordInput = Static<typeof changePasswordSchema>
