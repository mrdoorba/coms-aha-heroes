# AHA Heroes Stack Migration Design

**Date:** 2026-04-16
**Status:** Approved
**Scope:** Full frontend rewrite from React/TanStack to SvelteKit, maintaining existing Elysia backend

---

## 1. Overview

Migrate the AHA Heroes gamification app from its current React 19 + TanStack Start/Router frontend to SvelteKit 2 + Svelte 5, while keeping the entire Elysia backend (16 route modules, BetterAuth, RLS middleware, Drizzle ORM) untouched. The result is an "Inverted Monolith" where Elysia is the primary server hosting SvelteKit as its rendering engine.

### Current Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun |
| Backend | Elysia 1.3 + Nitro |
| Frontend | React 19 + TanStack Start/Router |
| Auth | BetterAuth 1.5.6 + Google OAuth |
| ORM | Drizzle 0.45 + postgres.js |
| Validation | TypeBox (backend) |
| UI | shadcn (React) + Tailwind + lucide-react + recharts |
| State | Zustand |
| i18n | Paraglide (React adapter) |
| Deploy | Cloud Run via Docker (Bun) |

### Target Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Bun (keep) |
| Backend | Elysia (keep, drop Nitro) |
| Frontend | SvelteKit 2 + Svelte 5 (runes) + svelte-adapter-bun |
| Auth | BetterAuth (keep) + BetterAuth Svelte client |
| ORM | Drizzle (keep) |
| Validation | TypeBox everywhere (backend + frontend) |
| Schema bridge | drizzle-typebox (single bridge) |
| API client | Eden Treaty (type-safe Elysia to Svelte) |
| UI | shadcn-svelte + Tailwind + lucide-svelte + LayerChart |
| Forms | Superforms + TypeBox adapter |
| State | Svelte 5 runes (singleton class pattern in .svelte.ts) |
| i18n | Paraglide SvelteKit adapter (ID/EN/TH) |
| PWA | @vite-pwa/sveltekit (basic: installable + offline shell) |
| Deploy | Cloud Run via Docker/Bun (keep) |

---

## 2. Architecture: The Inverted Monolith

Elysia is the entry point. It receives every HTTP request, handles `/api/*` routes itself, and delegates everything else to SvelteKit's request handler for SSR page rendering.

```
                    +----------------------------------+
                    |          Bun Runtime              |
                    |                                   |
 HTTP Request ----->     Elysia (primary server)        |
                    |       |                           |
                    |       +-- /api/auth/*  -> BetterAuth
                    |       +-- /api/health  -> health check
                    |       +-- /api/v1/*    -> 16 route modules
                    |       |    (auth + RLS middleware) |
                    |       |                           |
                    |       +-- /*  --> SvelteKit SSR   |
                    |                   (pages, PWA)    |
                    |                                   |
                    |  +-------------------------------+|
                    |  |   Drizzle + PostgreSQL         ||
                    |  |   (shared connection pool)     ||
                    |  +-------------------------------+|
                    +----------------------------------+
```

### Workspace Layout (Bun Workspaces)

```
coms_aha_heroes/
+-- packages/
|   +-- server/          # Elysia API + BetterAuth + entry point
|   |   +-- src/
|   |   |   +-- routes/       # 16 existing route modules (untouched)
|   |   |   +-- middleware/   # auth, RLS, error-handler (untouched)
|   |   |   +-- repositories/ # data access layer (untouched)
|   |   |   +-- services/     # business logic (untouched)
|   |   |   +-- functions/    # sheet sync, etc. (untouched)
|   |   |   +-- auth.ts       # BetterAuth config (untouched)
|   |   |   +-- index.ts      # Elysia app + SvelteKit mount
|   |   +-- package.json
|   +-- web/             # SvelteKit frontend (NEW)
|   |   +-- src/
|   |   |   +-- routes/       # Svelte pages
|   |   |   +-- lib/          # components, utils, rune modules
|   |   |   +-- hooks.server.ts  # BetterAuth session for SSR
|   |   |   +-- app.d.ts      # Type injection (User, Session from BetterAuth)
|   |   +-- static/           # PWA manifest, icons
|   |   +-- vite.config.ts    # SvelteKitPWA plugin
|   |   +-- package.json
|   +-- shared/          # Shared types & schemas
|       +-- src/
|       |   +-- db/
|       |   |   +-- schema/   # Drizzle table definitions (moved here)
|       |   +-- schemas/      # drizzle-typebox generated schemas
|       |   +-- types/        # App-wide TypeScript types
|       |   +-- constants/    # roles, permissions
|       +-- scripts/
|       |   +-- generate-schemas.ts  # Auto-generate TypeBox from Drizzle
|       +-- package.json
+-- project.inlang/      # Paraglide config (shared)
+-- drizzle.config.ts
+-- package.json          # Bun workspace root
+-- Dockerfile
+-- infra/               # Terraform/OpenTofu (unchanged)
```

### Key architectural decisions

- **Build order**: shared -> web -> server. SvelteKit must generate its `build/` folder before Elysia can mount it.
- **SvelteKit build path**: Use `SVELTEKIT_BUILD_PATH` env var so server can toggle between dev server proxy and production static build.
- **Type export**: `export type App = typeof app` from `packages/server/src/index.ts` enables Eden Treaty type inference in the web package.
- **Shared logger**: Use pino (or Bun's native console) across both Elysia middleware and SvelteKit `hooks.server.ts` for unified request tracing.
- **Drizzle config**: Root `drizzle.config.ts` must update its `schema` path to `packages/shared/src/db/schema/*` after migration. Migration output directory stays at root level.
- **Static assets**: Elysia serves SvelteKit's built client assets (`/web-build/client/`) via the Elysia static plugin. Static file requests are handled directly by Elysia for maximum performance, bypassing the SvelteKit SSR handler.

---

## 3. Data Flow & Validation: The TypeBox Pipeline

Drizzle tables are the single source of truth. Everything flows from them.

```
Drizzle Schema (packages/shared/src/db/schema/)
       |
       v
drizzle-typebox (auto-generated)
       |
       v
TypeBox Schemas (packages/shared/src/schemas/)
       |
       +----------------------+
       v                      v
  Elysia Routes          SvelteKit Forms
  (server-side)          (client-side)
       |                      |
  t.Object() in          Superforms +
  route .body()          TypeBox adapter
  route .query()              |
       |                      v
       v                 Form validation
  Eden Treaty <-------- (same schemas!)
  (type-safe client)
```

### Validation guarantee

| Layer | Validates with | Source |
|-------|---------------|--------|
| Database | Drizzle constraints | Table definitions |
| API routes | TypeBox (Elysia native) | drizzle-typebox generated |
| Forms (SSR) | TypeBox (Superforms adapter) | Same generated schemas |
| Forms (client) | TypeBox (Superforms client) | Same generated schemas |
| Eden Treaty | TypeScript types (compile-time) | Inferred from Elysia App type |

### Schema generation script

`packages/shared/scripts/generate-schemas.ts`:
- Reads all Drizzle table definitions from `packages/shared/src/db/schema/`
- Runs `createInsertSchema()` and `createSelectSchema()` from `drizzle-typebox`
- Writes generated TypeBox schemas to `packages/shared/src/schemas/`
- Triggered by: `bun run generate:schemas` or file watcher in dev

### Safety patterns

- **Sensitive field omission**: Use `Type.Omit(selectUserSchema, ['password_hash'])` for any schema representing data leaving the server.
- **Strict API responses**: Use `Type.Strict()` on outbound API schemas to ensure Elysia responses only contain defined fields. Prevents accidental data leakage from extra Drizzle result properties even when `Type.Omit` is applied.
- **Form extensions**: Use `Type.Intersect()` for UI-specific fields (e.g., `confirm_password`) that don't exist in the DB schema.
- **Localized error messages**: Schemas define rules (min, max, pattern). Human-readable messages live in Paraglide translation files. Superforms maps validation errors to i18n keys.

---

## 4. Auth & Identity: BetterAuth Bridging

BetterAuth stays in Elysia. SvelteKit reads -- never writes -- auth state.

```
+-----------------------------------------------------+
|                   Elysia Server                      |
|                                                      |
|  POST /api/auth/sign-in --> BetterAuth               |
|  POST /api/auth/callback --> (Google OAuth)          |
|  GET  /api/auth/session  --> returns session JSON    |
|                                                      |
|  BetterAuth sets session cookie <-- httpOnly, secure |
+-------------------+---------------------------------+
                    | same cookie
+-------------------v---------------------------------+
|                SvelteKit (SSR)                        |
|                                                      |
|  hooks.server.ts:                                    |
|    - Reads session cookie from request               |
|    - Calls BetterAuth's session verify (direct       |
|      function call, same process, no HTTP)           |
|    - Sets event.locals.user (typed)                  |
|    - Sets event.locals.session                       |
|                                                      |
|  +layout.server.ts:                                  |
|    - Returns { user } to all pages                   |
|    - Guards (authed) routes (redirect if no session) |
|    - Checks mustChangePassword flag                  |
|                                                      |
|  Client-side:                                        |
|    - BetterAuth Svelte client for sign-in/sign-out   |
|    - Reactive user state via runes                   |
+-----------------------------------------------------+
```

### Auth implementation details

| Concern | Implementation |
|---------|---------------|
| Session cookie | Set by BetterAuth (httpOnly, secure, SameSite=Lax). Same domain, shared between Elysia and SvelteKit (same process). |
| SSR session | `hooks.server.ts` calls BetterAuth verify against Drizzle session table. No external HTTP call. |
| Route guarding | `+layout.server.ts` in `(authed)/` group checks `event.locals.user`. Redirects to `/login` if missing. |
| Role-based access | `event.locals.user` includes role (employee/leader/admin). Layout and page-level guards enforce requirements. |
| Closed registration | Stays in Elysia BetterAuth hook -- blocks OAuth signup unless email exists in users/userEmails. Untouched. |
| Sign-in | `/login` page uses BetterAuth Svelte client -> `/api/auth/sign-in` -> cookie set -> redirect. |
| Sign-out | BetterAuth Svelte client -> `/api/auth/sign-out` -> cookie cleared -> redirect. |
| RLS context | Elysia middleware injects session user into DB transaction. SvelteKit never touches DB directly -- all via Eden Treaty -> Elysia -> RLS repositories. |
| CSRF | BetterAuth's built-in CSRF with correct `baseURL`. Elysia must not strip CSRF headers before SvelteKit handler. Superforms handles form tokens. |

### Type injection

In `packages/web/src/app.d.ts`, reference the `User` and `Session` types exported by BetterAuth from `packages/server`. This gives full autocomplete for custom fields (role, mustChangePassword) in Svelte components without manual type casting.

### What doesn't change

- BetterAuth config (`packages/server/src/auth.ts`)
- Auth middleware (`packages/server/src/middleware/auth.ts`)
- Session table schema
- Google OAuth flow
- Closed registration hook

---

## 5. State Management & Runes

SSR data flows down via SvelteKit load functions. Client-side reactivity lives in runes. No state management library.

### Three layers of state

| Layer | Mechanism | Scope | Examples |
|-------|-----------|-------|----------|
| Server data | SvelteKit `load()` -> `$props()` | Per-page, SSR-hydrated | User session, page data from Eden |
| Shared reactive | `.svelte.ts` rune modules | App-wide, client-only | Current user, UI preferences, locale |
| Component-local | `$state()` in components | Single component | Form inputs, dropdown state, modals |

### Singleton rune class pattern

```typescript
// packages/web/src/lib/state/userState.svelte.ts
class UserState {
  current = $state(null);
  isAdmin = $derived(this.current?.role === 'admin');
  isLeader = $derived(this.current?.role === 'leader' || this.isAdmin);

  init(initialUser) {
    this.current = initialUser;
  }

  clear() {
    this.current = null;
  }
}
export const userState = new UserState();
```

### SSR to client hydration

1. `hooks.server.ts` verifies cookie, sets `event.locals.user`
2. `+layout.server.ts` returns `{ user: event.locals.user }`
3. `+layout.svelte` receives via `$props()`, initializes `userState.init(data.user)`
4. BetterAuth Svelte client listens for auth events
5. On sign-out: `userState.clear()`, SvelteKit `invalidateAll()`

### Data fetching pattern

- `+page.ts` (universal load): Eden Treaty calls for most pages. Runs server-side on SSR, client-side on navigation. Same-process SSR calls = no network round-trip.
- `+page.server.ts` (server load): Used for admin/sensitive data fetches where the request should not be visible in browser network tab.

### Persistent UI state

`uiState.svelte.ts` uses `$effect` to auto-sync to localStorage (sidebar position, theme, locale preference).

### What replaces Zustand

| Current (Zustand) | New (Runes) |
|---|---|
| `useAuthStore()` | `userState.svelte.ts` singleton class |
| `useUIStore()` | `uiState.svelte.ts` with $effect localStorage sync |
| Component `useState` | `$state()` directly in .svelte components |

Context API (`setContext`/`getContext`) reserved only for component-tree-scoped concerns (Superforms form groups, shadcn-svelte table config).

---

## 6. UI & Component Strategy

shadcn-svelte provides the design system. LayerChart handles data visualization. Every component is Svelte 5 runes-native.

### Component architecture

```
packages/web/src/lib/
+-- components/
|   +-- ui/              # shadcn-svelte primitives (bits-ui based)
|   +-- charts/          # LayerChart compositions
|   |   +-- LeaderboardChart.svelte
|   |   +-- TeamPerformance.svelte
|   |   +-- PointsTrend.svelte
|   |   +-- DashboardStats.svelte
|   +-- forms/           # Superforms-powered (use:enhance on all)
|   |   +-- PointSubmissionForm.svelte
|   |   +-- UserEditForm.svelte
|   |   +-- ChallengeForm.svelte
|   |   +-- AppealForm.svelte
|   +-- layout/          # App shell
|   |   +-- Sidebar.svelte
|   |   +-- Header.svelte
|   |   +-- MobileNav.svelte
|   |   +-- PageContainer.svelte
|   +-- Icon.svelte      # Wrapper using $props() for consistent styling
```

### Page mapping (React to Svelte)

| Current React Route | New SvelteKit Route |
|---|---|
| `/_authed/` (layout) | `/(authed)/+layout.svelte` |
| `/_authed/dashboard` | `/(authed)/dashboard/+page.svelte` |
| `/_authed/leaderboard` | `/(authed)/leaderboard/+page.svelte` |
| `/_authed/teams` | `/(authed)/teams/+page.svelte` |
| `/_authed/points` | `/(authed)/points/+page.svelte` |
| `/_authed/challenges` | `/(authed)/challenges/+page.svelte` |
| `/_authed/appeals` | `/(authed)/appeals/+page.svelte` |
| `/_authed/rewards` | `/(authed)/rewards/+page.svelte` |
| `/_authed/admin/users` | `/(authed)/admin/users/+page.svelte` |
| `/_authed/admin/settings` | `/(authed)/admin/settings/+page.svelte` |
| `/_authed/admin/audit-logs` | `/(authed)/admin/audit-logs/+page.svelte` |
| `/_authed/admin/reports` | `/(authed)/admin/reports/+page.svelte` |
| `/login` | `/login/+page.svelte` |
| `/forgot-password` | `/forgot-password/+page.svelte` |
| `/change-password` | `/change-password/+page.svelte` |

### Charts (recharts to LayerChart)

| Chart | Migration |
|---|---|
| Leaderboard bars | `<Chart><Svg><Bar></Svg></Chart>` composable SVG |
| Team performance line | `<Chart><Svg><Line><Area></Svg></Chart>` |
| Dashboard sparklines | `<Chart>` with sparkline pattern |
| Points trend area | `<Chart><Svg><Area></Svg></Chart>` |

All charts CSS-styleable, responsive via container queries, animated with Svelte transitions. Use `$derived` runes for data processing (sorting, filtering) before passing to LayerChart for instant reactive updates.

### PWA setup

```
packages/web/
+-- static/
|   +-- manifest.webmanifest
|   +-- icons/ (192px, 512px)
+-- vite.config.ts
    +-- SvelteKitPWA({
          registerType: 'prompt',
          workbox: {
            navigateFallback: '/',
            globPatterns: ['**/*.{js,css,html,ico,png,svg}']
          }
        })
```

**Cache-Control**: Elysia API must send `Cache-Control: no-cache` to prevent the service worker from caching stale session state ("Ghost Login" prevention).

### Responsive design

- Mobile-first (app used on phones during field work)
- Sidebar collapses to bottom nav on mobile (MobileNav.svelte)
- shadcn-svelte Sheet component for mobile drawers
- Data tables become card lists on small screens

### Progressive enhancement

All Superforms use `use:enhance` for graceful submissions on jittery networks. No page blinks or reloads on point submissions.

---

## 7. i18n: Paraglide SvelteKit

| Concern | Implementation |
|---------|---------------|
| Library | `@inlang/paraglide-sveltekit` |
| Locales | ID / EN / TH (same as current) |
| Strategy | Cookie-based (`PARAGLIDE_LOCALE`) |
| Config | `project.inlang/` at workspace root |
| Usage | `import * as m from '$lib/paraglide/messages'` -> `{m.greeting()}` |
| Reactivity | Language rune in uiState triggers instant full-UI flip (including LayerChart labels) without page reload |
| Validation messages | Paraglide keys mapped in Superforms error display components |

---

## 8. Deployment: Docker & Cloud Run

### Dockerfile (updated for workspaces)

```dockerfile
# Stage 1: Install deps
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/web/package.json ./packages/web/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Stage 2: Build (shared -> web -> server)
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run --filter=shared build
RUN bun run --filter=web build
RUN bun run --filter=server build

# Stage 3: Production
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/web/build ./web-build
COPY --from=builder /app/package.json ./
EXPOSE 8080
CMD ["bun", "run", "dist/index.js"]
```

### Key changes from current Dockerfile

- Multi-package COPY for workspace structure
- Build order enforced: shared -> web -> server
- SvelteKit build output copied alongside server dist
- `SVELTEKIT_BUILD_PATH` env var for toggling dev/production mount
- Infra (Terraform/OpenTofu) and Cloud Run config: **unchanged**

---

## 9. Migration Strategy: Parallel Build

### Approach

Scaffold SvelteKit alongside the React frontend in the same repo. Build features in batches. Switch the Elysia fallback from React to SvelteKit once a milestone has parity. React code stays until full cutover, then is deleted.

### Migration order

1. **Shared Config**: Move Drizzle schema and Elysia into workspace packages (`/packages/server`, `/packages/shared`)
2. **Scaffold SvelteKit**: Place in `/packages/web`, configure PWA, Paraglide, shadcn-svelte
3. **Auth First**: Get BetterAuth working in SvelteKit (`hooks.server.ts`, login page, session hydration)
4. **Core Pages**: Port the most critical views (dashboard, leaderboard, points)
5. **Admin Pages**: Port admin views (users, settings, audit logs, reports)
6. **Polish**: Charts, animations, responsive refinements, i18n verification
7. **Cutover**: Switch Elysia fallback to SvelteKit, delete React code
8. **Clean up**: Remove TanStack, React, Nitro, Zustand dependencies

### Clean-as-you-go rule

Once a route is live and verified in SvelteKit, delete its React counterpart immediately. Do not maintain two implementations of the same page.

---

## 10. Decision Ledger

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Architecture | Inverted Monolith (Elysia hosts SvelteKit) | Most robust, single deployable, Elysia owns the process |
| 2 | Migration strategy | Parallel build, same repo, Bun workspaces | Keep working app, shared git history, no backend changes |
| 3 | Backend | Keep all 16 Elysia routes untouched | Proven, RLS-enforced, no rewrite risk |
| 4 | Auth | Keep BetterAuth + Svelte client | Working auth, no security risk from migration |
| 5 | Validation | TypeBox everywhere, drizzle-typebox only bridge | Single validation engine, fastest perf, zero drift |
| 6 | Forms | Superforms + TypeBox adapter + use:enhance | Progressive enhancement, native Svelte form handling |
| 7 | State | Singleton rune classes in .svelte.ts | No library needed, Svelte 5 native, testable |
| 8 | UI | shadcn-svelte + lucide-svelte | 1:1 mental model from React shadcn |
| 9 | Charts | LayerChart (D3-backed) | Composable SVG, $derived reactivity, CSS-styleable |
| 10 | PWA | @vite-pwa/sveltekit (basic, prompt) | Installable + offline shell, upgrade path to caching |
| 11 | i18n | Paraglide SvelteKit adapter (ID/EN/TH) | More mature than React adapter, reactive language flip |
| 12 | Deploy | Same Cloud Run, workspace Dockerfile | Build ordering enforced, single container |
| 13 | Monorepo tool | Bun workspaces (no Turborepo) | Single app, not multi-app; Bun native is sufficient |
| 14 | Shared logger | pino or Bun console | Unified request tracing across Elysia + SvelteKit |
