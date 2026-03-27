import type { ErrorHandler } from 'hono'

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(`[API Error] ${c.req.method} ${c.req.path}:`, err)

  if (err.name === 'ZodError') {
    return c.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: (err as any).issues,
        },
      },
      400,
    )
  }

  return c.json(
    {
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    },
    500,
  )
}
