# External App Integration Contract

> **Pilot note — portal origin:** During the pilot phase the portal is deployed
> to a Cloud Run URL, not yet to `coms.ahacommerce.net`. Wherever this document
> writes `<portal-origin>`, substitute the actual origin from the
> `PORTAL_ORIGIN` environment variable in your deployment. After the pilot
> cutover the value will be `https://coms.ahacommerce.net`. Relying parties
> MUST read `PORTAL_ORIGIN` from their env rather than hardcoding any URL.

## Purpose
This document is the onboarding contract for any service app that wants to join the COMS portal ecosystem while staying in its own repository, stack, and deployment.

The target UX is:
1. user logs in once at `<portal-origin>`
2. portal shows the services the user can access
3. user clicks a service such as `https://heroes.ahacommerce.net`
4. the service app obtains trust from the portal and creates its own local session
5. the user enters the app without a second interactive login

## Core rules
- The portal is the **control plane**.
- Service apps are **relying parties**, not identity authorities.
- Service apps may keep their own stack and repository.
- Service apps must **not** invent a competing login, global role model, or app-grant truth.
- Service apps must **not** trust sibling apps directly.
- Cross-service navigation must always resolve trust through the portal.

## Default architecture
### Control plane
- `<portal-origin>` (pilot: Cloud Run URL; production: `coms.ahacommerce.net`)
- owns central identity, global roles, app grants, and app registry metadata

### Service apps
- examples: `heroes.ahacommerce.net`, `orbit.ahacommerce.net`
- keep local app sessions and local domain data
- trust portal-issued handoff/token assertions

### Default transport for new repos
- `transportMode = portable_token`
- `handoffMode = one_time_code` or `token_exchange`
- `brokerOrigin = <portal-origin>` (set via `PORTAL_ORIGIN` env var)

### Compatibility mode
- `transportMode = same_host_cookie`
- use only when an app truly shares the same host/session boundary with the portal

## Normal path vs exception path
### Normal path
Use this when the app can add a thin server-side auth adapter.

Requirements:
- a `portal.integration.json` manifest
- an adapter that validates the portal-brokered trust handoff
- app-local session creation after successful exchange
- CI/compliance checks

### Exception path
Use this only when the app cannot use the normal adapter due to framework or infrastructure constraints.

Examples:
- edge-only validation
- proxy/gateway mediation
- legacy runtime with limited middleware hooks

Requirements:
- exception must still be declared in the manifest
- blocker reason must be explicit
- compliance status must not silently claim `compliant`

## Service-entry flow
### Portal -> service
1. user has a portal session
2. user clicks a service card
3. portal issues a short-lived handoff token or one-time code
4. browser lands on the service app
5. service validates or exchanges the handoff with the portal broker
6. service creates its own session

### Service -> sibling service
1. user is in `heroes.ahacommerce.net`
2. user opens `orbit.ahacommerce.net`
3. Orbit does **not** trust Heroes directly
4. Orbit resolves trust through `coms.ahacommerce.net`
5. Orbit creates its own session

## Manifest requirements
Every external repo should include `portal.integration.json` with:
- app slug and app name
- runtime metadata
- adapter type
- transport mode
- handoff mode
- broker origin when using brokered token flow
- protected route mode
- auth entrypoints
- protected route patterns
- required environment variables
- compliance status and contract version
- lifecycle webhook receiver declaration (see below)

See `docs/examples/portal.integration.json`.

## Token audience

Every handoff token the portal issues to an app carries an audience (`aud`) claim scoped to that specific app:

```
aud = portal:app:<appSlug>
```

e.g. `portal:app:heroes`, `portal:app:orbit`. Relying parties MUST verify this claim on exchange; the value is opaque to the app but must match the slug portal knows you by. Per-app audiences prevent a token leaked from one app from being replayed at a sibling.

## Session introspection

Local app sessions can outlive the portal session (different TTLs, or the user logged out of the portal after minting a local session). For sensitive operations — or on a periodic background cadence — relying parties SHOULD call:

```
POST <portal-origin>/api/auth/broker/introspect
Headers:
  Content-Type: application/json
  X-Portal-Introspect-Secret: <shared secret>
Body:
  { "userId": "<portal identity_users.id>", "sessionIssuedAt": "<ISO>", "appSlug": "<your slug>" }
```

Response:
- `{ "active": true, "user": {...} }` — portal session valid, user data attached.
- `{ "active": false, "revokedAt": "...", "reason": "logout|status_change|offboarded|admin" }` — revoke your local session.
- `404` — unknown user; treat as revoked.
- `401` — missing or wrong `X-Portal-Introspect-Secret`.
- `503` — introspection is not configured on the portal; fall back to local TTL.

The secret is shared per-installation (not per-app) today. It is stored in the portal API env as `PORTAL_INTROSPECT_SECRET`.

## Lifecycle webhooks

For push-style state updates, portal POSTs signed envelopes to a receiver URL the relying party exposes. The portal admin registers the URL + generates an HMAC secret via the portal admin UI; the secret is shown once and must be stored securely by the receiver.

### Envelope

```json
{
  "contractVersion": 1,
  "event": "session.revoked",
  "eventId": "<uuid>",
  "occurredAt": "<ISO>",
  "appSlug": "<your slug>",
  "payload": { ... }
}
```

### Events and payload shapes

| Event | Payload fields |
|---|---|
| `session.revoked` | `userId`, `gipUid`, `email`, `reason` (`logout` \| `status_change` \| `offboarded` \| `admin`), `notBefore` (ISO — sessions issued at or before this are invalid) |
| `user.provisioned` | `userId`, `gipUid`, `email`, `name`, `portalRole`, `teamIds`, `apps` |
| `user.updated` | same as `user.provisioned` plus `changedFields: string[]` |
| `user.offboarded` | `userId`, `gipUid`, `email`, `offboardedAt` |

### Headers

- `X-Portal-Signature: sha256=<hex>` — the HMAC of `timestamp + '.' + rawBody`.
- `X-Portal-Event: <event name>`
- `X-Portal-Event-Id: <uuid>` — use for idempotency; portal may retry with the same id.
- `X-Portal-Timestamp: <ISO>` — must equal `occurredAt` in the envelope; part of the signed material.

### Verification recipe

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

function verifyPortalWebhook(
  secret: string,
  timestampHeader: string,
  signatureHeader: string,
  rawBody: string,
): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret)
    .update(`${timestampHeader}.${rawBody}`)
    .digest('hex')
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
```

Reject the request if:
- the signature doesn't match,
- the `X-Portal-Timestamp` is older than ~5 minutes (replay guard),
- or the envelope's `contractVersion` is higher than you support.

### Delivery guarantees

- Portal retries on non-2xx up to 3 times with exponential backoff (30s, 2m, 10m) and then disables the endpoint. An admin must re-enable it.
- Deliveries are at-least-once; dedupe by `eventId`.
- Deliveries are NOT ordered across events. Within a single user, `session.revoked` and `user.offboarded` for the same offboarding action are fired in that order from portal but may arrive interleaved — rely on `occurredAt` to resolve.

## Deep-link preservation

When an unauthed user hits a service app at a deep URL like `https://heroes.ahacommerce.net/campaigns/42`, the app SHOULD bounce them to the portal with the original URL preserved:

```
<portal-origin>/?app=<yourSlug>&redirect_to=<urlencoded-original-url>
```

Portal will:
1. Authenticate the user (or reuse an existing portal session).
2. Issue a handoff for your app, passing `redirectTo` through to the broker.
3. Bounce the browser to your app's session-exchange path with `portal_redirect_to` in the query.

Your app, after minting its local session, reads `portal_redirect_to` and navigates the user to that URL. **Validate the value** — accept only paths on your own domain, to prevent open redirects.

### redirect_to validation

The portal validates the `redirect_to` value server-side before issuing the handoff: it compares the hostname of the submitted URL against the target app's registered URL in `app_registry`. Only URLs whose hostname exactly matches the registered host (or relative paths starting with `/`) are forwarded; all others are silently dropped.

This means:
- If your app's URL changes (e.g., Cloud Run URL → subdomain cutover), the portal admin updates `app_registry.url` and the validator picks up the new allowed host automatically — no code change required.
- Your app still MUST validate `portal_redirect_to` on receipt, as the portal enforces only the host, not the path.

## AI-agent default workflow
For a standard app repo, the default workflow should be:
1. read `portal.integration.json`
2. compare repo reality vs declared manifest
3. install or update the thin auth adapter
4. wire the service-entry handoff flow
5. add or update compliance checks
6. stop and escalate only when a real blocker exists

## Blockers that should trigger escalation
Escalate to a human only when one of these happens:
- no suitable middleware hook exists in the repo
- existing auth cannot be safely dual-run
- local user model cannot map to central identity cleanly
- deployment/network topology blocks the brokered handoff
- security constraints require a non-standard exception path

## Minimum done definition for an external repo
A repo is ready for pilot verification when:
- manifest exists and validates
- app can accept portal-brokered trust
- app creates a local session after exchange
- app no longer acts as auth/RBAC source of truth
- CI confirms the declared integration mode
