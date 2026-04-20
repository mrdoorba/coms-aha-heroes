import { createHmac, timingSafeEqual } from 'node:crypto'
import { Elysia } from 'elysia'
import { db } from '@coms/shared/db'
import { portalWebhookEvents } from '@coms/shared/db/schema'
import { destroySessionsForUserEmail } from '@coms/shared/auth/session'

type PortalEventBody = {
  userId?: string
  gipUid?: string
  email?: string
  reason?: string
  notBefore?: string
}

export function verifyPortalSignature(opts: {
  secret: string
  timestamp: string
  rawBody: string
  signatureHeader: string
}): boolean {
  const { secret, timestamp, rawBody, signatureHeader } = opts
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')
  const provided = signatureHeader.replace(/^sha256=/, '')

  if (expected.length !== provided.length) return false

  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'))
}

export const portalWebhooksRoute = new Elysia().post(
  '/webhooks/portal',
  async ({ request, set }) => {
    const secret = process.env.PORTAL_WEBHOOK_SIGNING_SECRET
    if (!secret) {
      console.error('[portal-webhook] PORTAL_WEBHOOK_SIGNING_SECRET is not configured')
      set.status = 500
      return { message: 'webhook secret not configured' }
    }

    const signature = request.headers.get('X-Portal-Signature')
    const timestamp = request.headers.get('X-Portal-Timestamp')
    const event = request.headers.get('X-Portal-Event')
    const eventId = request.headers.get('X-Portal-Event-Id')

    if (!signature || !timestamp || !event || !eventId) {
      set.status = 400
      return { message: 'missing header' }
    }

    const ts = Date.parse(timestamp)
    if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      set.status = 400
      return { message: 'timestamp skew' }
    }

    const rawBody = await request.text()

    if (!verifyPortalSignature({ secret, timestamp, rawBody, signatureHeader: signature })) {
      set.status = 401
      return { message: 'invalid signature' }
    }

    const inserted = await db
      .insert(portalWebhookEvents)
      .values({ eventId })
      .onConflictDoNothing()
      .returning({ eventId: portalWebhookEvents.eventId })

    if (inserted.length === 0) {
      console.log(`[portal-webhook] duplicate event ${eventId} — skipping`)
      return { ok: true }
    }

    const body = JSON.parse(rawBody) as PortalEventBody

    switch (event) {
      case 'session.revoked':
      case 'user.offboarded': {
        if (body.email) {
          const count = await destroySessionsForUserEmail(body.email)
          console.log(`[portal-webhook] ${event} — revoked ${count} session(s) for ${body.email}`)
        } else {
          console.log(`[portal-webhook] ${event} — no email in payload, nothing revoked`)
        }
        break
      }
      case 'user.provisioned':
      case 'user.updated': {
        console.log(`[portal-webhook] ${event} — no-op (email: ${body.email ?? 'n/a'})`)
        break
      }
      default: {
        console.log(`[portal-webhook] unknown event type: ${event}`)
      }
    }

    return { ok: true }
  },
)
