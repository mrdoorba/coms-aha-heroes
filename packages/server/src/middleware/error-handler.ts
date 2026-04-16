import type { ErrorHandler } from 'elysia'
import { AuthError } from './auth'

export const errorHandler: ErrorHandler = ({ error, set }) => {
  // Only log unexpected errors — AuthError and validation are expected control flow
  if (!(error instanceof AuthError) && !('name' in error && error.name === 'ValidationError')) {
    console.error(`[API Error]`, error)
  }

  if (error instanceof AuthError) {
    set.status = error.status
    return {
      success: false,
      data: null,
      error: { code: error.code, message: error.message },
    }
  }

  if ('name' in error && (error.name === 'ValidationError' || error.name === 'ZodError')) {
    set.status = 400
    return {
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: 'issues' in error ? (error as any).issues : undefined,
      },
    }
  }

  set.status = 500
  return {
    success: false,
    data: null,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  }
}
