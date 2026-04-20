import { env } from '$env/dynamic/private'
import type { PortalSessionUser } from '@coms/shared/auth/session'

export type IntrospectResult =
  | { active: true; user: PortalSessionUser }
  | { active: false; revokedAt: string; reason: string }

export class PortalIntrospectUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PortalIntrospectUnavailableError'
  }
}

type CacheEntry = { result: IntrospectResult; expiresAt: number }

const cache = new Map<string, CacheEntry>()

const CACHE_TTL_MS = 30_000
const RETRY_DELAYS_MS = [200, 600, 1200]

function requireEnv() {
  const origin = env.PORTAL_ORIGIN
  const secret = env.PORTAL_INTROSPECT_SECRET
  const appSlug = env.PORTAL_APP_SLUG
  if (!origin || !secret || !appSlug) {
    throw new Error(
      'PORTAL_ORIGIN, PORTAL_INTROSPECT_SECRET, and PORTAL_APP_SLUG must be set',
    )
  }
  return { origin, secret, appSlug }
}

async function fetchIntrospect(args: {
  userId: string
  sessionIssuedAt: string
}): Promise<Response> {
  const { origin, secret, appSlug } = requireEnv()
  return fetch(`${origin}/api/auth/broker/introspect`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-portal-introspect-secret': secret,
    },
    body: JSON.stringify({ userId: args.userId, sessionIssuedAt: args.sessionIssuedAt, appSlug }),
  })
}

export async function introspectSession(args: {
  sessionId: string
  userId: string
  sessionIssuedAt: string
}): Promise<IntrospectResult> {
  const { sessionId, userId, sessionIssuedAt } = args

  const cached = cache.get(sessionId)
  if (cached) {
    if (cached.expiresAt > Date.now()) return cached.result
    cache.delete(sessionId)
  }

  let lastStatus = 0

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]))
    }

    let res: Response
    try {
      res = await fetchIntrospect({ userId, sessionIssuedAt })
    } catch {
      // network error — treat as 503
      lastStatus = 503
      continue
    }

    lastStatus = res.status

    if (res.status === 200) {
      const body = (await res.json()) as IntrospectResult
      if (body.active) {
        cache.set(sessionId, { result: body, expiresAt: Date.now() + CACHE_TTL_MS })
      }
      return body
    }

    if (res.status === 401) {
      console.error('[portal-introspect] 401 from portal — PORTAL_INTROSPECT_SECRET misconfigured')
      throw new Error('Portal introspection auth rejected (401) — check PORTAL_INTROSPECT_SECRET')
    }

    if (res.status === 404) {
      return { active: false, revokedAt: new Date().toISOString(), reason: 'unknown_user' }
    }

    if (res.status === 503) {
      continue
    }

    // Unexpected status — don't retry
    throw new Error(`Portal introspection unexpected status ${res.status}`)
  }

  throw new PortalIntrospectUnavailableError(
    `Portal introspection unavailable after retries (last status: ${lastStatus})`,
  )
}
