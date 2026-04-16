import { treaty } from '@elysiajs/eden'
import type { App } from '@coms/server'

/** Browser-side Eden Treaty client — same origin, cookies sent automatically */
export const api = treaty<App>('', {
  fetch: { credentials: 'include' },
})

/** Extract data from an Eden response, throwing on error */
export function unwrap<T>(
  result: { data: T | null; error: any },
  fallback: string,
): T {
  if (result.error) {
    const msg = (result.error as any)?.value?.error?.message ?? fallback
    throw new Error(msg)
  }
  return result.data!
}
