import { beforeEach, describe, expect, it } from 'bun:test'
import { createHmac } from 'node:crypto'
import { verifyPortalSignature } from './portal-webhooks'

// ── HMAC helper unit tests (no db, no network) ───────────────────────────────

const TEST_SECRET = 'test-secret-value'

function makeSignature(secret: string, timestamp: string, body: string): string {
  const hex = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `sha256=${hex}`
}

describe('verifyPortalSignature', () => {
  const timestamp = new Date().toISOString()
  const rawBody = JSON.stringify({ email: 'alice@example.com' })
  const validSig = makeSignature(TEST_SECRET, timestamp, rawBody)

  it('returns true for a valid signature', () => {
    expect(
      verifyPortalSignature({
        secret: TEST_SECRET,
        timestamp,
        rawBody,
        signatureHeader: validSig,
      }),
    ).toBe(true)
  })

  it('returns false for a tampered body', () => {
    expect(
      verifyPortalSignature({
        secret: TEST_SECRET,
        timestamp,
        rawBody: rawBody + ' ',
        signatureHeader: validSig,
      }),
    ).toBe(false)
  })

  it('returns false for a tampered signature', () => {
    const tampered = validSig.slice(0, -4) + 'dead'
    expect(
      verifyPortalSignature({
        secret: TEST_SECRET,
        timestamp,
        rawBody,
        signatureHeader: tampered,
      }),
    ).toBe(false)
  })

  it('returns false when secret is wrong', () => {
    const wrongSig = makeSignature('wrong-secret', timestamp, rawBody)
    expect(
      verifyPortalSignature({
        secret: TEST_SECRET,
        timestamp,
        rawBody,
        signatureHeader: wrongSig,
      }),
    ).toBe(false)
  })

  it('returns false for a signature of different length (length mismatch path)', () => {
    expect(
      verifyPortalSignature({
        secret: TEST_SECRET,
        timestamp,
        rawBody,
        signatureHeader: 'sha256=abc',
      }),
    ).toBe(false)
  })

  it('accepts signature without sha256= prefix as raw hex', () => {
    const rawHex = createHmac('sha256', TEST_SECRET)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')
    // provided without prefix — strip does nothing, comparison still works
    expect(
      verifyPortalSignature({
        secret: TEST_SECRET,
        timestamp,
        rawBody,
        signatureHeader: rawHex,
      }),
    ).toBe(true)
  })
})

// ── Route-level tests (cases that short-circuit before db) ───────────────────
// These import the Elysia app without a db, exercising 400/401 paths only.

import { Elysia } from 'elysia'
import { portalWebhooksRoute } from './portal-webhooks'

const app = new Elysia({ prefix: '/api' }).use(portalWebhooksRoute)

const WEBHOOK_URL = 'http://localhost/api/webhooks/portal'

function makeHeaders(overrides: Record<string, string | null> = {}): Record<string, string> {
  const timestamp = new Date().toISOString()
  const body = JSON.stringify({ email: 'alice@example.com' })
  const sig = makeSignature(TEST_SECRET, timestamp, body)
  const defaults: Record<string, string> = {
    'X-Portal-Signature': sig,
    'X-Portal-Timestamp': timestamp,
    'X-Portal-Event': 'session.revoked',
    'X-Portal-Event-Id': 'evt-' + Math.random().toString(36).slice(2),
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

describe('POST /api/webhooks/portal — missing PORTAL_WEBHOOK_SIGNING_SECRET', () => {
  it('returns 500 when env var is not set', async () => {
    const orig = process.env.PORTAL_WEBHOOK_SIGNING_SECRET
    delete process.env.PORTAL_WEBHOOK_SIGNING_SECRET

    const res = await app.handle(makeRequest())
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.message).toBe('webhook secret not configured')

    if (orig !== undefined) process.env.PORTAL_WEBHOOK_SIGNING_SECRET = orig
  })
})

describe('POST /api/webhooks/portal — header validation', () => {
  beforeEach(() => {
    process.env.PORTAL_WEBHOOK_SIGNING_SECRET = TEST_SECRET
  })

  it('returns 400 when X-Portal-Signature is missing', async () => {
    const res = await app.handle(makeRequest({ 'X-Portal-Signature': null }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toBe('missing header')
  })

  it('returns 400 when X-Portal-Timestamp is missing', async () => {
    const res = await app.handle(makeRequest({ 'X-Portal-Timestamp': null }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toBe('missing header')
  })

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

describe('POST /api/webhooks/portal — timestamp skew', () => {
  beforeEach(() => {
    process.env.PORTAL_WEBHOOK_SIGNING_SECRET = TEST_SECRET
  })

  it('returns 400 when timestamp is more than 5 minutes old', async () => {
    const oldTimestamp = new Date(Date.now() - 6 * 60 * 1000).toISOString()
    const body = JSON.stringify({ email: 'alice@example.com' })
    const sig = makeSignature(TEST_SECRET, oldTimestamp, body)
    const res = await app.handle(
      makeRequest({ 'X-Portal-Timestamp': oldTimestamp, 'X-Portal-Signature': sig }, body),
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toBe('timestamp skew')
  })

  it('returns 400 when timestamp is more than 5 minutes in the future', async () => {
    const futureTimestamp = new Date(Date.now() + 6 * 60 * 1000).toISOString()
    const body = JSON.stringify({ email: 'alice@example.com' })
    const sig = makeSignature(TEST_SECRET, futureTimestamp, body)
    const res = await app.handle(
      makeRequest({ 'X-Portal-Timestamp': futureTimestamp, 'X-Portal-Signature': sig }, body),
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/webhooks/portal — HMAC verification', () => {
  beforeEach(() => {
    process.env.PORTAL_WEBHOOK_SIGNING_SECRET = TEST_SECRET
  })

  it('returns 401 when signature is tampered', async () => {
    const timestamp = new Date().toISOString()
    const body = JSON.stringify({ email: 'alice@example.com' })
    const goodSig = makeSignature(TEST_SECRET, timestamp, body)
    const tamperedSig = goodSig.slice(0, -4) + 'dead'
    const res = await app.handle(
      makeRequest(
        {
          'X-Portal-Timestamp': timestamp,
          'X-Portal-Signature': tamperedSig,
        },
        body,
      ),
    )
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe('invalid signature')
  })

  it('returns 401 when body is tampered after signing', async () => {
    const timestamp = new Date().toISOString()
    const signedBody = JSON.stringify({ email: 'alice@example.com' })
    const sig = makeSignature(TEST_SECRET, timestamp, signedBody)
    const res = await app.handle(
      makeRequest(
        {
          'X-Portal-Timestamp': timestamp,
          'X-Portal-Signature': sig,
        },
        JSON.stringify({ email: 'eve@example.com' }), // different body
      ),
    )
    expect(res.status).toBe(401)
  })
})
