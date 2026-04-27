import { beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { portalWebhooksRoute } from './portal-webhooks'

const app = new Elysia({ prefix: '/api' }).use(portalWebhooksRoute)

const WEBHOOK_URL = 'http://localhost/api/webhooks/portal'

function makeHeaders(overrides: Record<string, string | null> = {}): Record<string, string> {
  const defaults: Record<string, string> = {
    'X-Portal-Event': 'session.revoked',
    'X-Portal-Event-Id': 'evt-' + Math.random().toString(36).slice(2),
    'authorization': 'Bearer dummy-token',
  }
  const result: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...defaults, ...overrides })) {
    if (v !== null) result[k] = v
  }
  return result
}

function makeRequest(headersOverride: Record<string, string | null> = {}, body?: string): Request {
  const b = body ?? JSON.stringify({ email: 'alice@example.com' })
  return new Request(WEBHOOK_URL, {
    method: 'POST',
    headers: makeHeaders(headersOverride),
    body: b,
  })
}

describe('POST /api/webhooks/portal — header validation (pre-auth)', () => {
  it('returns 400 when X-Portal-Event is missing', async () => {
    const res = await app.handle(makeRequest({ 'X-Portal-Event': null }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toBe('missing header')
  })

  it('returns 400 when X-Portal-Event-Id is missing', async () => {
    const res = await app.handle(makeRequest({ 'X-Portal-Event-Id': null }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toBe('missing header')
  })
})

describe('POST /api/webhooks/portal — OIDC auth config', () => {
  beforeEach(() => {
    delete process.env.PORTAL_SERVICE_ACCOUNT_EMAIL
    delete process.env.SELF_PUBLIC_URL
  })

  it('returns 500 when PORTAL_SERVICE_ACCOUNT_EMAIL is missing', async () => {
    process.env.SELF_PUBLIC_URL = 'https://heroes.example'
    const res = await app.handle(makeRequest())
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.message).toBe('webhook auth not configured')
  })

  it('returns 500 when SELF_PUBLIC_URL is missing', async () => {
    process.env.PORTAL_SERVICE_ACCOUNT_EMAIL = 'portal-sa@example.iam.gserviceaccount.com'
    const res = await app.handle(makeRequest())
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.message).toBe('webhook auth not configured')
  })
})

describe('POST /api/webhooks/portal — bearer token validation', () => {
  beforeEach(() => {
    process.env.PORTAL_SERVICE_ACCOUNT_EMAIL = 'portal-sa@example.iam.gserviceaccount.com'
    process.env.SELF_PUBLIC_URL = 'https://heroes.example'
  })

  it('returns 401 when authorization header is absent', async () => {
    const res = await app.handle(makeRequest({ authorization: null }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe('missing bearer token')
  })

  it('returns 401 when authorization header lacks Bearer prefix', async () => {
    const res = await app.handle(makeRequest({ authorization: 'Basic abc123' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe('missing bearer token')
  })

  it('returns 401 when bearer token fails OIDC verification', async () => {
    const res = await app.handle(makeRequest({ authorization: 'Bearer not-a-real-id-token' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe('invalid bearer token')
  })
})
