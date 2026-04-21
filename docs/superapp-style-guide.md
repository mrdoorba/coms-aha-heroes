# COMS AHA Superapp Style Guide

> Ecosystem-wide engineering and design guidelines for apps joining the COMS portal
> control plane.
>
> Status: pilot (contract v1). Reference implementation: `heroes.ahacommerce.net`.
> Last reviewed: 2026-04-21.

---

## Table of contents

1. [Vision and principles](#1-vision-and-principles)
2. [Design system](#2-design-system)
3. [Component library](#3-component-library)
4. [Navigation conventions](#4-navigation-conventions)
5. [SSO integration](#5-sso-integration)
6. [Tech stack recommendations](#6-tech-stack-recommendations)
7. [Environment variables](#7-environment-variables)
8. [Compliance checklist](#8-compliance-checklist)
9. [Examples and references](#9-examples-and-references)

---

## 1. Vision and principles

### 1.1 What "superapp" means here

The COMS AHA ecosystem is a **superapp composed of independent service apps**
bound together by a single control plane. The user sees one product. Engineering
keeps separate repos, stacks, and deploy cadences.

- **Portal** (`coms.ahacommerce.net`) — the control plane. Owns identity,
  global roles, app grants, app registry, and lifecycle events.
- **Service apps** (`heroes.ahacommerce.net`, `orbit.ahacommerce.net`, …) —
  relying parties. Own their domain data and local sessions. They never own
  identity.
- **ServiceBar** — the top strip present on every app, rendering the portal and
  every service the user can reach. It is the visual expression of the superapp.

### 1.2 Guiding principles

| Principle | Concretely |
|---|---|
| Portal is the control plane | Identity, global roles, and app grants live in portal. Apps read, never write, these. |
| Apps are relying parties | Apps trust portal-issued handoffs. Apps do not invent their own login UI. |
| Single sign-on, always | A user who signed into portal reaches any permitted app without re-authenticating. |
| Unified feel, independent stacks | Apps MUST share the design tokens, ServiceBar, and SSO contract. Stack beyond that is the team's choice, within the preferred-stack guidance. |
| No sibling trust | Heroes never trusts Orbit directly. Cross-app navigation resolves trust through portal. |
| Fail closed | If a portal webhook or introspection endpoint cannot be verified, assume the session is invalid. |

### 1.3 Non-goals

- This document does NOT replace the SSO protocol spec. For wire-level details
  see `docs/external-app-integration-contract.md`.
- This document does NOT prescribe a specific product information architecture
  for each app. Apps own their information architecture below the ServiceBar.

---

## 2. Design system

All apps MUST ship the same core tokens. Heroes is the reference. If you are
starting a new app, copy `packages/web/src/app.css` as a starting point and
adapt only the places marked "app-specific" in section 2.8.

### 2.1 Color tokens (brand, direct usage)

Declared inside `@theme` for Tailwind v4. Consumable as Tailwind utilities
(`bg-gold`, `text-sky-blue`, etc.) and as plain CSS variables
(`var(--color-gold)`).

| Token | Hex | Tailwind utility | Usage |
|---|---|---|---|
| `--color-primary-dark` | `#1D388B` | `bg-primary-dark` | App chrome, deep sections, overlays on light bg |
| Primary (semantic) | `#325FEC` | `bg-primary` | Primary actions, links, focus rings |
| `--color-primary-light` | `#96ADF5` | `bg-primary-light` | Light tints, hover states on dark surfaces, gradient endpoints |
| `--color-deep-navy` | `#0F0E7F` | `bg-deep-navy` | Sidebar background, hero backdrops |
| `--color-gold` | `#F4C144` | `bg-gold` | Rewards, accolades, highlights, gamification |
| `--color-purple` | `#6D50B8` | `bg-purple` | Secondary emphasis, challenged state |
| `--color-sky-blue` | `#759EEE` | `bg-sky-blue` | Gradient pair for primary, info states |
| `--color-penalti` | `#C73E3E` | `bg-penalti` | Penalty/warning surfaces (distinct from destructive) |

> Semantic primary (`--primary`) is declared in the `:root` block as
> `oklch(0.51 0.22 264)`, which corresponds to brand `#325FEC`. Components
> that come from shadcn-svelte consume the semantic token; brand surfaces
> consume the hex token directly. Do not duplicate the same color under two
> names in component code — pick one.

### 2.2 Status colors

| Token | Hex | Applies to |
|---|---|---|
| `--color-status-active` | `#22C55E` | Active, approved, live |
| `--color-status-pending` | `#F4C144` | Pending, waiting-on, in-review |
| `--color-status-challenged` | `#6D50B8` | Disputed, under challenge |
| `--color-status-rejected` | `#EF4444` | Rejected, denied, error |

Status color MUST match across apps. A "pending" pill in Heroes and a "pending"
pill in Orbit use the same gold.

### 2.3 Semantic tokens (shadcn layer)

Declared on `:root` (light) and `.dark` (dark) in `oklch` color space. These
are what shadcn-svelte components consume.

```css
:root {
  --background: oklch(0.970 0.010 258);
  --foreground: oklch(0.13 0.02 265);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.13 0.02 265);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.13 0.02 265);
  --primary: oklch(0.51 0.22 264);          /* #325FEC */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.94 0.025 264);
  --secondary-foreground: oklch(0.25 0.08 264);
  --muted: oklch(0.96 0.008 264);
  --muted-foreground: oklch(0.50 0.04 264);
  --accent: oklch(0.94 0.025 264);
  --accent-foreground: oklch(0.25 0.08 264);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.910 0.012 264);
  --input: oklch(0.910 0.012 264);
  --ring: oklch(0.51 0.22 264);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.12 0.025 265);
  --foreground: oklch(0.985 0.005 265);
  --card: oklch(0.18 0.022 265);
  --primary: oklch(0.65 0.20 264);
  --primary-foreground: oklch(0.15 0.03 265);
  --border: oklch(0.28 0.025 265);
  --ring: oklch(0.65 0.20 264);
  /* see Heroes packages/web/src/app.css for the full set */
}
```

Rule: new apps may tune lightness values for taste, but keep hue close to
`264` (the ecosystem blue) so cross-app transitions don't flash a different
palette.

### 2.4 Shadows and radii

Declared inside `@theme`:

```css
--shadow-card:        0 2px 12px rgba(15, 14, 127, 0.10), 0 1px 3px rgba(0,0,0,0.06);
--shadow-card-hover:  0 8px 28px rgba(15, 14, 127, 0.16), 0 2px 8px rgba(0,0,0,0.08);
--shadow-modal:       0 8px 32px rgba(15, 14, 127, 0.18), 0 2px 8px rgba(0,0,0,0.10);
--shadow-glow-gold:   0 0 20px rgba(244, 193, 68, 0.35), 0 4px 12px rgba(244, 193, 68, 0.20);
--shadow-glow-blue:   0 0 20px rgba(50, 95, 236, 0.30), 0 4px 12px rgba(50, 95, 236, 0.18);
```

Radii scale off a single base `--radius: 0.625rem` (10px):

| Token | Multiplier | Resolves to |
|---|---|---|
| `--radius-sm` | × 0.6 | 6px |
| `--radius-md` | × 0.8 | 8px |
| `--radius-lg` | × 1.0 | 10px (base) |
| `--radius-xl` | × 1.4 | 14px |
| `--radius-2xl` | × 1.8 | ~18px |
| `--radius-3xl` | × 2.2 | ~22px |
| `--radius-4xl` | × 2.6 | ~26px |

Rule: components use `rounded-lg` or `rounded-xl` by default. Avoid hardcoding
radii in component markup.

### 2.5 Typography

- **Family**: Manrope, shipped via `@fontsource/manrope` (weights 200–800).
  Fallback: `sans-serif`.
- **Loading**: import per-weight CSS files at the top of `app.css`. Do NOT load
  Manrope from Google Fonts via a `<link>` tag — it bypasses the bundler's
  font self-hosting.

```css
/* Top of app.css */
@import "@fontsource/manrope/200.css";
@import "@fontsource/manrope/300.css";
@import "@fontsource/manrope/400.css";
@import "@fontsource/manrope/500.css";
@import "@fontsource/manrope/600.css";
@import "@fontsource/manrope/700.css";
@import "@fontsource/manrope/800.css";
```

Fluid helper classes every app ships:

```css
.text-fluid-hero  { font-size: clamp(1.25rem, 4vw, 2rem);   line-height: clamp(1.2, 1.1 + 0.5vw, 1.4); font-weight: 800; letter-spacing: -0.02em; }
.text-fluid-title { font-size: clamp(1rem, 2.5vw, 1.5rem);  line-height: 1.2; font-weight: 700; }
.text-fluid-stat  { font-size: clamp(1.5rem, 5vw, 2.5rem);  line-height: 1;   font-weight: 900; letter-spacing: -0.03em; }
```

Weight guidance:

| Weight | Used for |
|---|---|
| 200–300 | Rare. Decorative oversized numerals on marketing-like surfaces only. |
| 400 | Body copy, table cells |
| 500 | Emphasized body, labels |
| 600 | Section titles, card titles |
| 700 | Page titles, navigation active state |
| 800 | Hero numerals, fluid stat |

### 2.6 Motion and reduced motion

Shared animation tokens (timing curve `cubic-bezier(0.22, 1, 0.36, 1)`,
durations 200–450ms for UI, 6–8s for ambient login effects).

Every app MUST respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .stat-enter, .shimmer-gold, .pulse-gold, .glow-gold,
  .float-slow, .float-slower, .login-stars, .login-glow,
  .login-particle, .login-fade-in, .stagger-item, .card-hover {
    animation: none;
    transition: none;
  }
  .login-fade-in { opacity: 1; }
  .card-hover:hover { transform: none; }
  .btn-gradient-blue:hover,
  .btn-gradient-gold:hover,
  .btn-gradient-red:hover,
  .btn-gradient-purple:hover { transform: none; }
  .shine-on-hover::after { display: none; }
  .tap-active:active { transform: none; }
}
```

Rule: if you introduce a new animated utility, add it to the reduced-motion
block in the same PR.

### 2.7 Dark mode

- Trigger class: `.dark` on `<html>` or a high ancestor.
- Tailwind v4 variant: `@custom-variant dark (&:is(.dark *));`
- All tokens in 2.3 have a `.dark` counterpart. All images and icons must work
  on both palettes. No `png` drop shadows baked for light-only backgrounds.
- The ThemeToggle component writes the user's preference to `localStorage`
  and flips the class on `<html>`. No server round trip for a theme flip.

### 2.8 Shared utility classes (copy these)

The following classes are ecosystem-wide and MUST be present in every app's
`app.css` with the same behavior. They may be re-styled only in coordination
with the portal team.

| Class | Purpose |
|---|---|
| `.app-bg` | Gradient mesh page background (light + dark variants) |
| `.card-surface` | Semi-transparent card with backdrop blur on md+ |
| `.card-surface-solid` | Opaque variant for print / low-blur contexts |
| `.card-hover` | Lifts card on hover via shadow + 2px translate |
| `.btn-gradient-blue` | Primary CTA gradient |
| `.btn-gradient-gold` | Rewards / celebration CTA |
| `.btn-gradient-purple` | Secondary emphasis CTA |
| `.btn-gradient-red` | Destructive / penalty CTA (distinct from shadcn destructive) |
| `.shimmer-gold` | Highlights "earned" or "featured" states |
| `.pulse-gold` / `.glow-gold` | Attention callouts (e.g. unread reward) |
| `.stat-enter`, `.stagger-item` | Enter animations for dashboards and lists |
| `.text-fluid-hero/title/stat` | Fluid typography helpers |
| `.section-label` | Uppercase micro-label above a section |
| `.sidebar-link-active` | Sidebar active-state treatment |
| `.bnav-active` | MobileNav active-tab underline |
| `.scrollbar-hide` | Hide overflow scrollbars on horizontal rails |
| `.tap-active` | Mobile press-state scale |
| `.shine-on-hover` | Diagonal light sweep for premium buttons |

App-specific visual assets (mascot art, illustrations, login starfields) are
fine to replace per app, but keep the gradient mesh look of `.app-bg` and the
card elevation model.

---

## 3. Component library

### 3.1 Baseline: shadcn-svelte "nova"

All Svelte apps in the ecosystem MUST initialise shadcn-svelte with:

- style: `nova`
- base color: `zinc`
- icons: `lucide`
- globalCss path: `src/app.css`
- component aliases under `$lib/components/ui`

`components.json` (copy into every Svelte app root):

```json
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "style": "nova",
  "tailwind": {
    "css": "src/app.css",
    "baseColor": "zinc"
  },
  "aliases": {
    "components": "$lib/components",
    "ui": "$lib/components/ui",
    "utils": "$lib/utils",
    "hooks": "$lib/hooks",
    "lib": "$lib"
  },
  "typescript": true,
  "registry": "https://shadcn-svelte.com/registry"
}
```

For non-Svelte apps (e.g., React): use `shadcn/ui`, `nova` style, base color
`zinc`, same tokens. The goal is that a Tailwind class compiled from either
ecosystem resolves to the same color.

### 3.2 Reuse vs. build-new

| Concern | Source |
|---|---|
| Buttons, inputs, selects, dialogs, sheets | shadcn-svelte (do not fork) |
| Forms | `sveltekit-superforms` + shadcn form wrappers |
| Tables | shadcn `Table` + column definitions per app |
| Charts | `layerchart` (reference stack) or a chart lib consuming the same tokens |
| Icons | `lucide-svelte` only. Custom SVGs live under `src/lib/components/icons/` |
| Gradient CTAs | The shared `.btn-gradient-*` classes — NOT re-rolled in Tailwind per app |
| Status badges | Consume `--color-status-*`. Ship as a local `StatusBadge` that takes a status prop. |
| Notifications/toasts | `svelte-sonner` (reference stack) |
| Layout shell components (ServiceBar, TopBar, Sidebar, MobileNav) | Copied from Heroes on day one, then maintained per app. See §4. |

Build new only when no reusable primitive exists for the domain object. Do not
re-wrap a shadcn Button with a minor padding tweak as a new component — use
class names.

### 3.3 Icons

- Library: `lucide-svelte` (Svelte) / `lucide-react` (React).
- Default size: `16` in dense chrome, `18–20` in primary buttons, `24` in empty
  states.
- Stroke width: default `2`. For 12–14px icons drop to `1.75` for legibility.
- Color: inherit via `currentColor`. Do not set fills on lucide icons.

### 3.4 Font

- Manrope only. No secondary families.
- Do not ship variable-weight fonts. Use the weights you need from
  `@fontsource/manrope`.

### 3.5 Content density

- Default base font size: `16px`.
- Form control height: 40px (`h-10`) comfortable, 36px (`h-9`) dense tables.
- Card padding: `p-4` mobile, `p-6` desktop.
- Always use 4-px spacing scale from Tailwind; avoid arbitrary px values in
  production code.

---

## 4. Navigation conventions

### 4.1 The ServiceBar

The ServiceBar is the ecosystem's signature element. It is a fixed strip at the
very top of every authenticated page.

Specification:

- **Position**: `fixed; top: 0; left: 0; right: 0`
- **z-index**: `70` (must sit above the app's own TopBar which uses `z-50`)
- **Height**: `36px` (Tailwind `h-9`)
- **Background**: `#080c1e` (near-black navy) with a `1px` bottom border at
  `white/8`
- **Padding**: `px-3`
- **Gap between items**: `gap-1`

Each item:

- `11px` font, `font-semibold`
- Inactive: `text-white/45`, hover `text-white/80 bg-white/6`
- Active (current app): `bg-white/10 text-white`, no hover transition
- Border radius: `rounded` (4px)
- Height: `h-6`, padding `px-2.5`

Content order (left to right):

1. **Portal** — links to `PORTAL_ORIGIN`. Opens in a new tab (`target="_blank"`
   with `rel="noopener noreferrer"`).
2. **Your app** — non-link, shows active state.
3. **Other apps** — rendered from the portal app registry (fetched at login or
   via the exchange response). Inactive state. Same-tab navigation is fine.

Reference: `packages/web/src/lib/components/layout/ServiceBar.svelte`.

### 4.2 Layout offset

Because ServiceBar is fixed, the main layout MUST reserve space for it.

Rule: the app's root authenticated layout wrapper applies `pt-8` (32px —
slightly less than 36px to allow the TopBar backdrop-blur to visually bleed
under the ServiceBar), and the app's `TopBar` sits at `top-8` (not `top-0`).

Do not shift layout on scroll. ServiceBar and TopBar are both fixed.

### 4.3 App layout shell

Every authenticated page inside an app renders inside this structure:

```
<ServiceBar />       <!-- fixed, z-70, h-9 -->
<TopBar />           <!-- fixed, z-50, under ServiceBar, contains app branding -->
<Sidebar />          <!-- desktop only, md+ -->
<main pt-8>          <!-- page content -->
<MobileNav />        <!-- md-, fixed bottom, tabs -->
```

TopBar contents (required, left-to-right):

1. App logo + name (links to app root).
2. Breadcrumb (collapses to just the current page title on mobile).
3. Spacer.
4. Notifications badge (count bubble on an icon button).
5. Theme toggle.
6. Language switcher (must list at least ID, EN, TH).
7. User avatar (dropdown: profile, sign out, switch app).

Do not introduce app-specific items in the TopBar without review — put them in
the sidebar or a page-level action row.

### 4.4 Sidebar (desktop)

- Background: `--sidebar` (dark navy).
- Collapsible. Widths are driven by a `--sidebar-width` CSS variable:
  `4rem` collapsed, `16rem` expanded.
- Active link uses `.sidebar-link-active` (gradient left-to-right wash +
  `font-weight: 700`).
- Must include at the bottom: user block with avatar, role pill, and a
  "Switch app" affordance that links to the portal.

### 4.5 MobileNav (mobile)

- Fixed to bottom. Height: `calc(4rem + env(safe-area-inset-bottom))` with
  `padding-bottom: env(safe-area-inset-bottom)` — required for iPhone notch/home bar.
- 3–5 items max. Icon above label. Label at `10–11px`, label weight `500`,
  active weight `700`.
- Active state shows `.bnav-active` (3px gradient bar above icon).
- `.tap-active` for press feedback.
- Min tap target: `44×44px` (Apple HIG / WCAG 2.5.5). Never shrink below `min-h-[44px]`.

### 4.6 Mobile compatibility requirements

Every app MUST be fully usable on a smartphone. This is not optional — the
primary device for most users is mobile.

#### Viewport

Every HTML document MUST include:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Do not set `user-scalable=no` — it breaks accessibility.

#### Responsive breakpoints

| Breakpoint | Class prefix | Used for |
|---|---|---|
| < 768px | (default) | Mobile — MobileNav visible, Sidebar hidden |
| ≥ 768px | `md:` | Desktop/tablet — Sidebar visible, MobileNav hidden |

All layout decisions use only this single breakpoint. Do not introduce `sm:` or
`lg:` variants for layout (fine for typography/spacing).

#### Touch targets

- All tappable elements: `min-h-[44px] min-w-[44px]` (Apple HIG minimum).
- Nav items, buttons, list rows: meet the 44px target.
- Icon-only buttons: wrap in `h-10 w-10` container minimum.
- Never rely on hover states alone — every hover affordance must have a
  tap equivalent.

#### Safe area insets (notch / home bar)

- MobileNav: `h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]`
- Any fixed bottom elements: add `pb-[env(safe-area-inset-bottom)]`
- Page content that scrolls near the bottom: add `pb-safe` or equivalent padding
  so content is not obscured by the home indicator.

#### Scroll behavior

- Avoid `overflow: hidden` on `<body>` except when a modal/sheet is open.
- Horizontal scrolling: allow on data tables and carousels only. Always use
  `.scrollbar-hide` on those containers.
- Pull-to-refresh: use `PullToRefresh.svelte` on pages that fetch live data.

#### PWA (if enabled)

- `manifest.webmanifest` must use the brand palette: `theme_color: "#1D388B"`,
  `background_color: "#080c1e"`.
- Service worker scope: `/`. Precache the app shell; network-first for API.
- Add `apple-touch-icon` at 180×180px.

#### Forms on mobile

- `type="email"` / `type="number"` / `type="tel"` on inputs — triggers the
  correct virtual keyboard.
- `autocomplete` attributes on all auth and profile fields.
- Avoid dialogs with many fields — prefer sheets (`<Sheet>` from shadcn) which
  slide up from the bottom and feel native on mobile.

### 4.7 Active-state detection

Apps MUST highlight the current app in the ServiceBar and the current page in
the Sidebar / MobileNav.

Rules:

- Current app: determined by the app's own `PORTAL_APP_SLUG` env — do not
  infer from `window.location.hostname` so local dev on localhost still
  highlights correctly.
- Current page: a path-prefix match on `$page.url.pathname` (SvelteKit) or the
  framework equivalent. Wildcards allowed for dynamic segments.
- Never require more than one source of truth for the active route in a single
  view.

---

## 5. SSO integration

This is the thinnest possible summary. The authoritative spec is
`docs/external-app-integration-contract.md` (contract v1). Read it. Do not
copy the protocol details from this document — they will drift.

### 5.1 Flow summary

1. User is authenticated at the portal.
2. User clicks a service card in the portal.
3. Portal issues a short-lived **one-time code** and redirects the browser to
   `https://<your-app>/auth/portal/exchange?portal_code=...`.
4. Your app server calls the portal broker to exchange the code for a signed
   handoff (JWS).
5. Your app verifies the JWS audience claim equals `portal:app:<your slug>`,
   then mints a **local session** (cookie `coms_session`, 7-day TTL).
6. The user continues to the deep link passed via `portal_redirect_to`, or
   the app root.

### 5.2 Mandatory per-app surface area

Every service app MUST ship, at minimum:

- `portal.integration.json` manifest at the repo root.
- A server-side **exchange route** (default: `GET /auth/portal/exchange`) that:
  - accepts `portal_code` and optional `portal_redirect_to`,
  - exchanges with the broker,
  - verifies signature and audience,
  - mints a local session,
  - validates `portal_redirect_to` against its own hostname / relative paths,
  - redirects the user.
- A **logout route** (default: `POST /auth/portal/logout`) that clears the
  local cookie and may optionally notify the portal.
- A **webhook receiver** (default: `POST /api/webhooks/portal`) that:
  - verifies `X-Portal-Signature` against the shared HMAC secret over
    `timestamp + "." + rawBody`,
  - rejects timestamps older than ~5 minutes,
  - dedupes on `X-Portal-Event-Id`,
  - handles at minimum `session.revoked`, `user.provisioned`, `user.updated`,
    `user.offboarded`.
- **Audience verification** on every exchange. Reject handoffs whose `aud`
  is not exactly `portal:app:<your slug>`.
- **No competing login UI**. The only way into an app is via a portal handoff.
  Local admin accounts for ops/debug must be explicitly called out in the
  manifest `compliance.notes`.
- **Deep link preservation**. If a visitor lands on a protected deep URL
  without a session, the app MUST redirect to:
  ```
  <PORTAL_ORIGIN>/?app=<PORTAL_APP_SLUG>&redirect_to=<urlencoded-original-url>
  ```

### 5.3 Session introspection

For sensitive operations (e.g., granting roles, moving money) OR on a periodic
background cadence, apps SHOULD call:

```
POST <PORTAL_ORIGIN>/api/auth/broker/introspect
  X-Portal-Introspect-Secret: <PORTAL_INTROSPECT_SECRET>
  Content-Type: application/json
  { "userId": "<portal id>", "sessionIssuedAt": "<iso>", "appSlug": "<your slug>" }
```

Treat `404` and `{ "active": false }` as "revoke local session now". Treat
`503` as "portal introspection is offline; fall back to local TTL and log the
degradation".

### 5.4 Local session model

- Cookie name: `coms_session` (every app uses the same name — cookies are
  scoped per-origin so there is no collision).
- TTL: 7 days default. Shorter is fine; longer is not.
- Flags: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- The session table in your local DB is the source of truth for local
  authorisation. `portalUserId` is the foreign key to identity.

---

## 6. Tech stack recommendations

### 6.1 Preferred stack (Heroes reference)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | SvelteKit v2 + Svelte v5 (Runes) | Small bundle, server-capable, used by Heroes |
| Bundler | Vite v6 | Standard across the ecosystem |
| Backend framework | Elysia v1 on Bun | Fast, TypeScript-native, shares types with frontend |
| ORM | Drizzle | Type-safe, migration-friendly |
| Database | PostgreSQL | Portal and reference apps use it |
| Validation | Typebox | Shared between server/web, plays well with Elysia |
| Type-safe RPC | Elysia Eden | Drop-in client from server types |
| Monorepo | Bun workspaces (`web`, `server`, `shared`) | Matches Heroes layout |
| i18n | Paraglide-js | Compile-time, tree-shakeable. Locales: ID, EN, TH |
| PWA | `@vite-pwa/sveltekit` | Offline-friendly service apps |
| CI/CD | GitHub Actions | Standard across repos |
| Deploy | Cloud Run (Docker + Bun) | Same target as portal |
| Icons | `lucide-svelte` | Shared everywhere |
| Notifications | `svelte-sonner` | Consistent toast UX |

### 6.2 Mandatory vs. optional

| Requirement | Mandatory | Notes |
|---|---|---|
| Design tokens from §2 | Yes | Including the `@theme` block, oklch semantic tokens, shared utility classes |
| ServiceBar + layout shell | Yes | Per §4 |
| SSO contract compliance | Yes | Per §5 and `external-app-integration-contract.md` |
| Manrope font, Lucide icons, shadcn "nova" base | Yes | Cross-app visual consistency |
| Locales ID + EN + TH | Yes | Even if strings are initially copy-paste |
| PWA | Optional | Enable if your app has meaningful offline surface |
| Preferred stack (SvelteKit + Elysia + Bun + Drizzle) | Optional | Teams can use other stacks if every item in §8 still passes |
| Cloud Run deploy | Optional | Same-cloud recommended to simplify networking; other targets fine if the SSO contract is met |

If you diverge from the preferred stack, document your choices and the
consequences (e.g., "Next.js + Node — Paraglide adapter changes; icons are
`lucide-react`; audience verification uses `jose`").

### 6.3 Directory layout (preferred-stack reference)

```
/
├── portal.integration.json
├── packages/
│   ├── web/        # SvelteKit app (UI + hooks.server.ts adapter)
│   ├── server/     # Elysia API (business logic, DB, webhooks)
│   └── shared/     # Typebox schemas, types, constants shared across packages
├── drizzle.config.ts
├── docker-compose.yml
└── docs/
    ├── design.md
    ├── architecture.md
    └── (app-specific)
```

### 6.4 Non-negotiable code conventions

- TypeScript everywhere (strict). No `any` in PRs without a comment.
- No console.log in shipped code. Use a structured logger (e.g., `pino`).
- Environment variables read via a typed loader, not `process.env.X` at call
  sites.
- No direct DB access from route handlers — go through the `server` package or
  its non-Svelte equivalent.
- One migration PR at a time; migrations are additive.

---

## 7. Environment variables

### 7.1 Naming convention

Every SSO-related variable is prefixed `PORTAL_`. App-local variables should
use your app's own prefix (e.g., `HEROES_`, `ORBIT_`). Never reuse `PORTAL_*`
for app-internal things.

### 7.2 Required variables

All service apps MUST read these from the environment (not hardcoded):

| Name | Required | Purpose |
|---|---|---|
| `PORTAL_ORIGIN` | yes | Origin of the portal broker. Pilot: the Cloud Run URL. Production: `https://coms.ahacommerce.net`. |
| `PORTAL_APP_SLUG` | yes | The slug this app is registered under. Example: `heroes`. Used to build audience and ServiceBar active state. |
| `PORTAL_TOKEN_AUDIENCE` | yes | Expected `aud` on exchange JWS. MUST equal `portal:app:<slug>`. |
| `PORTAL_BROKER_SIGNING_SECRET` | yes | HS256 shared secret for verifying the exchange JWS. Provisioned out-of-band by the portal team. |
| `PORTAL_INTROSPECT_SECRET` | yes | Shared secret for calling `POST /api/auth/broker/introspect`. |
| `PORTAL_WEBHOOK_SIGNING_SECRET` | yes | HMAC secret for verifying incoming webhook deliveries. Shown once at registration — store it immediately. |

### 7.3 Optional variables

| Name | Default | Purpose |
|---|---|---|
| `PORTAL_EXCHANGE_PATH` | `/auth/portal/exchange` | Override the exchange route path if your framework requires it. |
| `PORTAL_WEBHOOK_PATH` | `/api/webhooks/portal` | Override the webhook receiver path. |
| `PORTAL_SESSION_TTL_SECONDS` | `604800` (7 days) | Local session TTL cap. Must not exceed portal policy. |
| `PORTAL_INTROSPECT_CADENCE_SECONDS` | `3600` | Background introspection interval. `0` disables periodic checks. |
| `PORTAL_DEEP_LINK_RETURN` | `true` | If true, preserves deep links via `portal_redirect_to`. |

### 7.4 `.env.example` pattern

Every repo MUST commit a `.env.example` that documents every variable used. For
SSO variables, copy this block verbatim:

```dotenv
# --- Portal SSO (required) ---
PORTAL_ORIGIN=https://coms.ahacommerce.net
PORTAL_APP_SLUG=your-slug
PORTAL_TOKEN_AUDIENCE=portal:app:your-slug
PORTAL_BROKER_SIGNING_SECRET=
PORTAL_INTROSPECT_SECRET=
PORTAL_WEBHOOK_SIGNING_SECRET=

# --- Portal SSO (optional; defaults shown) ---
# PORTAL_EXCHANGE_PATH=/auth/portal/exchange
# PORTAL_WEBHOOK_PATH=/api/webhooks/portal
# PORTAL_SESSION_TTL_SECONDS=604800
# PORTAL_INTROSPECT_CADENCE_SECONDS=3600
# PORTAL_DEEP_LINK_RETURN=true

# --- App-local ---
# DATABASE_URL=postgres://...
# (add your app-specific vars here, prefixed e.g. HEROES_ / ORBIT_)
```

### 7.5 Secret handling

- Secrets MUST NOT be committed. `.env` files are gitignored.
- In production, secrets come from Secret Manager (Cloud Run) or equivalent,
  never from a plain env var attached to a container build.
- Rotate `PORTAL_WEBHOOK_SIGNING_SECRET` and `PORTAL_INTROSPECT_SECRET` on a
  schedule agreed with the portal team. Coordinate to avoid windows where both
  sides disagree.

---

## 8. Compliance checklist

An app is ready for pilot verification when every item below is satisfied.
Copy this list into your PR description or launch ticket and tick each item.

### 8.1 Design

- [ ] `@theme` block matches §2.1 tokens (hexes and CSS var names), including `--color-primary-light: #96ADF5`.
- [ ] oklch semantic tokens from §2.3 are declared for `:root` and `.dark`.
- [ ] `--radius: 0.625rem` base and derived `--radius-*` present.
- [ ] Shadows from §2.4 declared with the same values.
- [ ] Manrope loaded via `@fontsource/manrope` (weights 200–800).
- [ ] `.app-bg`, `.card-surface`, `.card-hover`, `.btn-gradient-*`,
      `.text-fluid-*`, `.section-label`, `.sidebar-link-active`,
      `.bnav-active`, `.scrollbar-hide`, `.tap-active` present and behave the
      same as in Heroes.
- [ ] `prefers-reduced-motion` block disables every animated utility.
- [ ] Dark mode works on every screen (no hardcoded `#fff` or `#000`).
- [ ] shadcn initialised with `style: "nova"`, base color `zinc`, icons
      `lucide`.

### 8.2 Navigation

- [ ] ServiceBar rendered on every authenticated page with the spec in §4.1.
- [ ] Layout offsets the fixed ServiceBar (`pt-8` on main, TopBar at `top-8`).
- [ ] TopBar has logo, breadcrumb, notifications, theme toggle, language
      switcher (ID + EN + TH), user avatar.
- [ ] Sidebar uses collapsible width CSS variable (`4rem` / `16rem`).
- [ ] MobileNav has 3–5 items, safe-area-aware (`env(safe-area-inset-bottom)`),
      uses `.bnav-active` and `.tap-active`.
- [ ] MobileNav hidden on `md:` and above; Sidebar hidden below `md:`.
- [ ] All tappable elements meet 44×44px minimum tap target.
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1" />` present.
- [ ] No hover-only interactions (every affordance works by tap).
- [ ] Forms use correct `type=` and `autocomplete` attributes.
- [ ] PWA manifest uses `theme_color: "#1D388B"` and `background_color: "#080c1e"` (if PWA enabled).
- [ ] Current app active state on ServiceBar is driven by
      `PORTAL_APP_SLUG`, not hostname.

### 8.3 SSO

- [ ] `portal.integration.json` present at repo root and validates against
      the contract v1 schema.
- [ ] Exchange route implemented; verifies audience equals
      `portal:app:<slug>`.
- [ ] Exchange route validates `portal_redirect_to` against own hostname /
      relative path before redirecting.
- [ ] Logout route clears the `coms_session` cookie.
- [ ] Webhook receiver verifies HMAC, checks 5-minute replay window,
      dedupes on `eventId`, handles `session.revoked`,
      `user.provisioned`, `user.updated`, `user.offboarded`.
- [ ] Unauthenticated access to a protected deep URL redirects to
      `<PORTAL_ORIGIN>/?app=<slug>&redirect_to=<urlencoded>`.
- [ ] No competing login UI. If local ops accounts exist, they are documented
      in `compliance.notes` in the manifest.
- [ ] Session introspection implemented for sensitive operations.

### 8.4 Environment and configuration

- [ ] `.env.example` committed with every `PORTAL_*` variable from §7.
- [ ] No `PORTAL_*` value is hardcoded anywhere in the repo.
- [ ] Secrets are loaded from Secret Manager / equivalent in production.
- [ ] `PORTAL_SESSION_TTL_SECONDS` does not exceed the portal-policy maximum.

### 8.5 Security

- [ ] `coms_session` cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`.
- [ ] Webhook handler uses `timingSafeEqual` for signature comparison.
- [ ] Exchange code is single-use and rejected on reuse.
- [ ] Replay window ≤ 5 minutes on webhooks.
- [ ] Error responses do not leak broker details, user PII, or stack traces
      to the browser.
- [ ] CSP / security headers reviewed; `frame-ancestors` restricts embedding
      to portal domains if embedding is intended.
- [ ] Introspection fallback (`503`) is logged as a degradation, not silently
      ignored.
- [ ] App rejects any portal-issued token whose `aud` is not its own slug.
- [ ] Automated tests cover: successful exchange, replay rejection, bad
      audience rejection, missing webhook signature, stale webhook timestamp.

### 8.6 Observability and CI

- [ ] CI runs lint, typecheck, and unit tests on every PR.
- [ ] CI verifies `portal.integration.json` against the schema.
- [ ] Structured logs on every SSO event (`exchange_attempt`,
      `exchange_success`, `exchange_failed`, `webhook_received`,
      `webhook_rejected`, `introspection_failure`).
- [ ] Error tracking wired (Sentry or equivalent).

### 8.7 Accessibility (baseline)

- [ ] All interactive elements reachable by keyboard.
- [ ] Focus ring visible (`--ring` token) on focus-visible.
- [ ] Color contrast ≥ 4.5:1 for body text in both palettes.
- [ ] `prefers-reduced-motion` honoured (see §2.6).
- [ ] Images and icons have text alternatives or `aria-hidden` when decorative.

---

## 9. Examples and references

### 9.1 In this repo

| Path | Purpose |
|---|---|
| `docs/external-app-integration-contract.md` | Authoritative SSO protocol spec |
| `docs/design.md` | Heroes-specific design notes |
| `docs/architecture.md` | Heroes architecture overview |
| `docs/portal-build-spec.md` | Portal build spec (read for context, not as app guidance) |
| `docs/super-app-sso-proposal.md` | Background on why the SSO shape is what it is |
| `docs/examples/portal.integration.json` | Copyable manifest template |
| `docs/examples/ai-agent-onboarding-checklist.md` | The AI-agent version of §8 |
| `docs/examples/app-inventory-template.md` | Template for declaring your app to the portal team |
| `docs/examples/pilot-selection-rubric.md` | How pilots are selected |
| `packages/web/src/app.css` | Design tokens, utility classes, animation system — the canonical copy |
| `packages/web/src/lib/components/layout/ServiceBar.svelte` | Reference ServiceBar implementation |
| `packages/web/src/lib/components/layout/TopBar.svelte` | Reference TopBar |
| `packages/web/src/lib/components/layout/Sidebar.svelte` | Reference Sidebar |
| `packages/web/src/lib/components/layout/MobileNav.svelte` | Reference MobileNav |
| `packages/web/src/hooks.server.ts` | Reference exchange + session wiring |
| `packages/web/components.json` | shadcn-svelte config to copy |
| `portal.integration.json` | Heroes' live manifest — compare to the template |

### 9.2 Starting a new app: first-week plan

1. **Day 1** — Clone the Heroes layout skeleton (web / server / shared).
   Copy `app.css`, `components.json`, and layout components.
2. **Day 1** — Draft `portal.integration.json` from the template. Pick your
   slug. Open a ticket to the portal team to register the app.
3. **Day 2** — Wire the exchange + logout routes. Use `hooks.server.ts` from
   Heroes as the model. Verify audience against `portal:app:<slug>`.
4. **Day 2** — Wire the webhook receiver. Use the verification recipe from
   the SSO contract document. Add idempotency via `eventId`.
5. **Day 3** — Implement ServiceBar, TopBar, Sidebar, MobileNav. Resolve
   active state from `PORTAL_APP_SLUG`, not hostname.
6. **Day 3** — Set up i18n with Paraglide (ID / EN / TH).
7. **Day 4** — Build the first protected page. Verify deep-link preservation
   by clearing cookies and hitting the URL directly.
8. **Day 5** — Run through the §8 checklist. Fix what fails.
9. **Day 5** — Hand the app to the portal team for pilot verification. They
   flip `compliance.status` from `planned` to `verified` once it passes.

### 9.3 Getting help

- SSO protocol questions → portal team via the `#coms-portal` channel.
- Design token questions → design-systems owner on the Heroes team.
- Manifest schema changes → submit a PR against the contract doc; the portal
  team owns the schema version bump.

### 9.4 Versioning

- This guide tracks **contract v1**. Breaking changes will bump the contract
  version and will be announced with a migration window.
- Apps should record the contract version they target in
  `portal.integration.json > compliance.contractVersion`.

---

*End of style guide. Keep this document under 900 lines. When adding
sections, prefer linking out to spec documents over duplicating protocol
details here.*
