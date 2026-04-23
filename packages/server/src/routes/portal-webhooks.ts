import { createHmac, timingSafeEqual } from 'node:crypto'
import { Elysia } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '@coms/shared/db'
import { portalWebhookEvents, users, branches } from '@coms/shared/db/schema'
import { destroySessionsForUserEmail } from '@coms/shared/auth/session'
import { USER_ROLES } from '@coms/shared/constants'
import type { UserRole } from '@coms/shared/constants'

type PortalEventBody = {
  userId?: string
  gipUid?: string
  email?: string
  name?: string
  reason?: string
  notBefore?: string
  appRole?: string | null
  branch?: string | null
  changedFields?: string[]
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

function toUserRole(appRole: string | null | undefined): UserRole | null {
  if (!appRole) return null
  return (USER_ROLES as readonly string[]).includes(appRole) ? (appRole as UserRole) : null
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
      case 'user.provisioned': {
        if (!body.email) {
          console.log(`[portal-webhook] ${event} — no email in payload, skipping`)
          break
        }

        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, body.email))
          .limit(1)

        const role = toUserRole(body.appRole) ?? 'employee'

        if (existing) {
          const updates: Partial<typeof users.$inferInsert> = {}
          if (body.name) updates.name = body.name
          if (toUserRole(body.appRole)) updates.role = role
          if (Object.keys(updates).length > 0) {
            await db.update(users).set(updates).where(eq(users.id, existing.id))
            console.log(`[portal-webhook] ${event} — updated existing user ${body.email}: ${Object.keys(updates).join(', ')}`)
          } else {
            console.log(`[portal-webhook] ${event} — user ${body.email} exists, no fields to update`)
          }
        } else {
          let branchId: string | undefined
          if (body.branch) {
            const [matched] = await db
              .select({ id: branches.id })
              .from(branches)
              .where(eq(branches.code, body.branch))
              .limit(1)
            branchId = matched?.id
            if (!branchId) {
              console.warn(`[portal-webhook] ${event} — branch "${body.branch}" not found, falling back to default`)
            }
          }
          if (!branchId) {
            const [fallback] = await db.select({ id: branches.id }).from(branches).limit(1)
            if (!fallback) {
              console.error(`[portal-webhook] ${event} — cannot provision user ${body.email}: no branches exist`)
              break
            }
            branchId = fallback.id
          }

          await db.insert(users).values({
            email: body.email,
            name: body.name ?? body.email.split('@')[0],
            role,
            branchId,
            canSubmitPoints: false,
            mustChangePassword: false,
            isActive: true,
          })
          console.log(`[portal-webhook] ${event} — provisioned new user ${body.email} with role ${role}`)
        }
        break
      }
      case 'user.updated': {
        if (!body.email) {
          console.log(`[portal-webhook] ${event} — no email in payload, skipping`)
          break
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, body.email))
          .limit(1)

        if (!user) {
          console.warn(`[portal-webhook] ${event} — no local user found for ${body.email}`)
          break
        }

        const updates: Partial<typeof users.$inferInsert> = {}
        if (body.name) updates.name = body.name
        const newRole = toUserRole(body.appRole)
        if (newRole) updates.role = newRole

        if (Object.keys(updates).length === 0) {
          console.log(`[portal-webhook] ${event} — no applicable fields to update for ${body.email}`)
          break
        }

        await db.update(users).set(updates).where(eq(users.id, user.id))
        console.log(`[portal-webhook] ${event} — updated user ${body.email}: ${Object.keys(updates).join(', ')}`)
        break
      }
      default: {
        console.log(`[portal-webhook] unknown event type: ${event}`)
      }
    }

    return { ok: true }
  },
)
