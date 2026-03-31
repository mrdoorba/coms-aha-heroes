import { treaty } from '@elysiajs/eden'
import type { App } from '~/server'

/** Browser-side Eden Treaty client */
export const api = treaty<App>('/')

/** Server-side Eden Treaty client factory — forwards cookies from the incoming request */
export function createServerApi(request: Request) {
  const url = new URL(request.url)
  return treaty<App>(`${url.protocol}//${url.host}`, {
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
  })
}

/** Extract data from an Eden Treaty response, throwing on error */
export function unwrap(
  result: { data: any; error: any },
  fallback: string,
) {
  if (result.error) {
    throw new Error(result.error.value?.error?.message ?? fallback)
  }
  return result.data
}
