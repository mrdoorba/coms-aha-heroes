import { env } from '$env/dynamic/private'
import { jwtVerify } from 'jose'
import type { PortalSessionUser } from '@coms/shared/auth/session'

export type PortalBrokerExchangePayload = {
  appSlug: string
  brokeredAt: string
  expiresAt: string
  redirectTo: string | null
  sessionUser: PortalSessionUser
}

export class PortalBrokerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'PortalBrokerError'
  }
}

function requireEnv() {
  const origin = env.PORTAL_ORIGIN
  const appSlug = env.PORTAL_APP_SLUG
  const audience = env.PORTAL_TOKEN_AUDIENCE
  const signingSecret = env.PORTAL_BROKER_SIGNING_SECRET
  if (!origin || !appSlug || !audience || !signingSecret) {
    throw new Error(
      'PORTAL_ORIGIN, PORTAL_APP_SLUG, PORTAL_TOKEN_AUDIENCE, and PORTAL_BROKER_SIGNING_SECRET must be set',
    )
  }
  return { origin, appSlug, audience, signingSecret }
}

type WireResponse = {
  appSlug: string
  handoffMode: 'token_exchange'
  token: string
  expiresAt: string
  redirectUrl: string | null
}

type VerifiedClaims = {
  appSlug: string
  brokeredAt: string
  expiresAt: string
  redirectTo: string | null
  sessionUser: PortalSessionUser
}

function isPortalSessionUser(v: unknown): v is PortalSessionUser {
  if (!v || typeof v !== 'object') return false
  const u = v as Record<string, unknown>
  return (
    typeof u.id === 'string' &&
    typeof u.gipUid === 'string' &&
    typeof u.email === 'string' &&
    typeof u.name === 'string' &&
    typeof u.portalRole === 'string' &&
    Array.isArray(u.teamIds) &&
    Array.isArray(u.apps)
  )
}

function assertVerifiedClaims(payload: Record<string, unknown>): VerifiedClaims {
  if (
    typeof payload.appSlug !== 'string' ||
    typeof payload.brokeredAt !== 'string' ||
    typeof payload.expiresAt !== 'string' ||
    !isPortalSessionUser(payload.sessionUser)
  ) {
    throw new PortalBrokerError(401, 'Invalid portal token: missing required claims')
  }
  return {
    appSlug: payload.appSlug,
    brokeredAt: payload.brokeredAt,
    expiresAt: payload.expiresAt,
    redirectTo: typeof payload.redirectTo === 'string' ? payload.redirectTo : null,
    sessionUser: payload.sessionUser as PortalSessionUser,
  }
}

export async function exchangePortalCode(code: string): Promise<PortalBrokerExchangePayload> {
  const { origin, appSlug, audience, signingSecret } = requireEnv()

  const res = await fetch(`${origin}/api/auth/broker/exchange`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ appSlug, code }),
  })

  if (!res.ok) {
    let message = `Portal broker exchange failed (${res.status})`
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      // non-JSON body; keep the default message
    }
    throw new PortalBrokerError(res.status, message)
  }

  const wrapper = (await res.json()) as WireResponse

  let payload: Record<string, unknown>
  try {
    const secret = new TextEncoder().encode(signingSecret)
    const result = await jwtVerify(wrapper.token, secret, {
      issuer: 'portal-broker',
      audience,
    })
    payload = result.payload as Record<string, unknown>
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new PortalBrokerError(401, `Invalid portal token: ${msg}`)
  }

  return assertVerifiedClaims(payload)
}

export function buildPortalSignInUrl(redirectTo?: string): string {
  const { origin } = requireEnv()
  if (redirectTo) {
    return `${origin}/?app=heroes&redirect_to=${encodeURIComponent(redirectTo)}`
  }
  return `${origin}/`
}
