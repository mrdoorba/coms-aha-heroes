# AHA HEROES - Architecture Document

> **Status:** DRAFT - Under Refinement
> **Last Updated:** 2026-03-24
> **Version:** 0.9.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [GCP Resources](#3-gcp-resources)
4. [System Architecture](#4-system-architecture)
5. [Monorepo Structure](#5-monorepo-structure)
6. [Database Design](#6-database-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [API Design](#8-api-design)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Google Sheets Integration](#10-google-sheets-integration)
11. [Infrastructure as Code (OpenTofu)](#11-infrastructure-as-code-opentofu)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Future AI Integration](#13-future-ai-integration)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Decision Log](#15-decision-log)
16. [Open Questions](#16-open-questions)

---

## 1. Overview

### What

AHA HEROES is an internal HR web application that replaces the current Google Sheets/Forms + WhatsApp + Zapier workflow for tracking employee achievement points.

### Why

- Current workflow spans Google Sheets, Forms, WhatsApp, and Zapier — fragmented, no access control, no audit trail
- Need data separation between branches (Indonesia and Thailand)
- Need role-based access (Admin, HR, Leader, Employee)
- Need multi-language support (Indonesian, English, Thai)
- Need challenge/appeal system for fairness

### Who

- **All employees** (~100 users initially) — view own points, leaderboard, self-submit achievements
- **Leaders** — nominate employees, approve team self-submissions, challenge submissions
- **HR** — nominate anyone in branch, resolve challenges/appeals, approve redemptions
- **Admin** (developer, 1 person) — full access all branches, manage system settings

### Core Features

- 4 types of achievement points: Poin Bintang sAHAbat, Poin Penalti Staff AHA, Poin AHA, Redeem Poin AHA
- Submit, challenge, appeal, revoke achievement points
- Rewards catalog and redemption system (HR-approved)
- Dashboard with leaderboards (Bintang + Poin AHA, visible to all employees, filterable by team)
- Comment threads on submissions for discussion
- In-app notification system
- Import data from Google Sheets (deferred to Phase 3)
- Export reports to Google Sheets (deferred to Phase 3)
- Multi-language UI (Indonesian, English, Thai)
- Branch-separated data with role-based access
- Mobile-responsive PWA (add to home screen, bottom navigation, offline indicator)

### Point Types — Detailed Specifications

#### 1. Poin Bintang sAHAbat (Positive Recognition)

| Property | Value |
|----------|-------|
| **Purpose** | Recognize positive contributions |
| **Points per submission** | 1 Bintang (fixed) |
| **Impact on Poin AHA** | +10 per Bintang (configurable via system_settings) |
| **Who can give** | Leader (any employee in branch), HR (anyone in branch), Admin (anyone) |
| **Self-submit** | Employee can self-submit → needs Leader approval |
| **Leader self-give** | Not allowed. Leader A can give Leader B. |
| **Screenshot** | Required |

**Submission form fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Nama Staff | User selector | Yes | Employee receiving the Bintang |
| Perbuatan | Text | Yes | Format: "[siapa] berkontribusi dalam [apa]" |
| Related staff | Text/user tags | No | All staff involved (documentation only — points go to Nama Staff only) |
| Screenshot | File upload | Yes | Evidence of contribution |

---

#### 2. Poin Penalti Staff AHA (Penalty)

| Property | Value |
|----------|-------|
| **Purpose** | Record rule violations with severity tracking |
| **Points per submission** | 1-10 (variable, based on violation level) |
| **Impact on Poin AHA** | -5 per Penalti point (configurable). E.g., 3 Penalti points = -15 Poin AHA |
| **Who can give** | Leader (any employee in branch), HR (anyone in branch), Admin (anyone) |
| **Self-submit** | Not applicable (penalties are given, not self-reported) |
| **Leader self-give** | Not allowed |
| **Screenshot** | Required |
| **Appeal** | Affected employee can appeal → points FROZEN until HR resolves |

**Submission form fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Nama Staff | User selector | Yes | Employee receiving the Penalti |
| Komponen KITTA | Select one | Yes | See KITTA categories below |
| Kejadian | Text | Yes | Format: "[siapa] [apa] sehingga [dampak]" |
| Related staff | Text/user tags | No | All staff involved (documentation only) |
| Tingkat Pelanggaran | Select 1-10 | Yes | = number of Penalti points deducted |
| Screenshot | File upload | Yes | Evidence of violation |

**KITTA Categories** (Komponen penilaian):

| Code | Name | Description |
|------|------|-------------|
| `K` | Kualitas Hasil | Quality of work output |
| `I` | Inisiatif | Initiative and proactiveness |
| `T1` | Taat Aturan | Rule compliance / SOP adherence |
| `T2` | Teamwork | Collaboration and team contribution |
| `A` | Kualitas Absensi | Attendance quality |

**Violation Severity Scale:**

| Level | Description | Notes |
|-------|-------------|-------|
| 1 | Tidak sesuai SOP | 1 point per category |
| 2 | Berdampak terhadap member lain | Affects other team members |
| 3 | Berdampak terhadap pihak luar | Affects Supplier/Marketplace/Customer |
| 4-5 | Menimbulkan kerugian finansial | Causes financial loss |
| 6-10 | Pelanggaran berat | Severe violations |

**Escalation rules:**
- Multiple violations in one finding = increases violation level
- Repeated major violations may result in ST/SP (Surat Teguran / Surat Peringatan) — handled outside the app for now
- 1 submission = 1 KITTA category (separate submissions for multiple categories)

---

#### 3. Poin AHA (Direct Points)

| Property | Value |
|----------|-------|
| **Purpose** | Reward participation in activities and events |
| **Points per submission** | 1-10 (variable, based on level) |
| **Impact on Poin AHA** | Direct — Level = Poin AHA earned. Level 3 = +3 Poin AHA |
| **Who can give** | Leader (any employee in branch), HR (anyone in branch), Admin (anyone) |
| **Self-submit** | Employee can self-submit → needs Leader approval |
| **Leader self-give** | Not allowed. Leader A can give Leader B. |
| **Screenshot** | Optional |

**Submission form fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Nama Staff | User selector | Yes | Employee receiving the points |
| Kegiatan | Text | Yes | Format: "[siapa] berpartisipasi dalam [apa]" |
| Related staff | Text/user tags | No | All staff involved (documentation only) |
| Level | Select 1-10 | Yes | = number of Poin AHA awarded |
| Screenshot | File upload | No | Optional evidence |

---

#### 4. Redeem Poin AHA (Spend Points)

| Property | Value |
|----------|-------|
| **Purpose** | Exchange accumulated Poin AHA for rewards |
| **Minimum balance** | None — just enough to cover reward cost |
| **Who can request** | Any employee, leader |
| **Approval** | HR approves each redemption |
| **Screenshot** | Not required |

**Redemption form fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Nama Staff | User selector | Yes | Shows current Poin AHA balance |
| Hadiah | Select from catalog | Yes | Rewards + costs from Google Sheets data (Phase 1: seeded manually) |
| Keterangan | Text | No | Additional notes (e.g., size for kaos/seragam AHA) |

**Rewards catalog:** Managed by HR. Data sourced from Google Sheets. Examples: power bank, mug, sticker, kaos/seragam AHA, vacation, etc. Each reward has a point cost.

---

#### Poin AHA Balance Calculation

```
Poin AHA Balance = direct_poin_aha
                 + (bintang_count × bintang_point_impact)
                 - (penalti_points_sum × penalti_point_impact)
                 - redeemed_total
```

Where:
- `direct_poin_aha` = sum of all active Poin AHA awards (each 1-10 based on level)
- `bintang_count` = number of active Bintang awards (each always = 1)
- `bintang_point_impact` = 10 (configurable in system_settings)
- `penalti_points_sum` = sum of all active Penalti points (each 1-10 based on violation level)
- `penalti_point_impact` = 5 (configurable in system_settings)
- `redeemed_total` = sum of approved redemption costs
- Penalti at 'frozen' status (under appeal) are **excluded** from the calculation
- Changing impact values is **retroactive** — affects all historical balances

**Example:** Employee has 3 Bintang, 1 Penalti (level 2), 2 direct Poin AHA (level 5 + level 3), redeemed 20 points:
```
Balance = (5 + 3) + (3 × 10) - (2 × 5) - 20 = 8 + 30 - 10 - 20 = 8
```

### Constraints

- All infrastructure on GCP (single billing)
- ~100 users initially, design for scalability
- Mobile-first design — most employees will use smartphones
- Google Sheets integration deferred (not a launch blocker)

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose | Chosen Over |
|-----------|---------|---------|-------------|
| **TanStack Start** | v1 (Vite + TanStack Router) | Full-stack React framework, SSR, streaming, type-safe routing + search params, lighter runtime than Next.js | Next.js (heavier runtime, Vercel-coupled), Nuxt (smaller ecosystem) |
| **TypeScript** | 6.0 | Type safety across the stack (last JS-based release before Go-based TS 7) | JavaScript |
| **Tailwind CSS** | 4.2 | Utility-first styling, CSS variables, logical properties for RTL-readiness | Chakra UI (runtime CSS-in-JS), MUI (heavy bundle) |
| **shadcn/ui** | latest | Accessible component primitives (Radix-based), you own the code | Ant Design (massive bundle), Headless UI (fewer components) |
| **Paraglide JS** | latest | i18n with official TanStack Start support — compile-time typed functions, ~2KB bundle, built-in locale routing + SSR middleware, ICU via plugin | next-intl (Next.js-specific), i18next (22KB, runtime parsing), Lingui (no built-in routing) |
| **TanStack Table** | v8 | Headless, type-safe data tables with sorting, filtering, pagination | AG Grid (paid license), MUI DataGrid (MUI lock-in) |
| **TanStack Query** | v5 | Server state management, caching, background refetching | SWR (less features), raw fetch |
| **Zustand** | latest | Minimal client-side global state (theme, sidebar) | Redux (boilerplate), Jotai (overkill for this scope) |

### Backend

| Technology | Version | Purpose | Chosen Over |
|-----------|---------|---------|-------------|
| **Hono** | >=4.12.4 | Ultra-lightweight API framework (14KB), Web Standards, middleware-first. Embedded in TanStack Start via API wildcard route (`/api/$`). Pin >=4.12.4 to avoid CVE-2026-29045 (serveStatic auth bypass) | Express (legacy), FastAPI (two-language stack), NestJS (heavy), TanStack Start server functions alone (no streaming uploads, no OpenAPI, no external API testing) |
| **TypeScript** | 6.0 | Same language as frontend = shared types, schemas, constants | Python (no shared types with frontend) |
| **Drizzle ORM** | 0.45.x | Type-safe SQL, zero-overhead (compiles to raw SQL), PostgreSQL-native. Pin to stable 0.45.x — v1.0 beta has breaking changes | Prisma (query engine binary, slower cold starts), SQLAlchemy (different language) |
| **Resend** | latest | Transactional email (auth only: password reset, future invites). Free tier: 100 emails/day | SendGrid (overkill), SES (complex setup) |
| **Zod** | latest | Runtime validation + static type inference, shared with frontend | Joi (no TS inference), Pydantic (Python only) |
| **Hono RPC** | latest | End-to-end type safety between backend routes and frontend client. TanStack Start server functions used selectively for SSR loaders and simple component-colocated mutations | tRPC (heavier), GraphQL (overkill for CRUD-heavy app), OpenAPI codegen (extra step) |
| **Better Auth** | >=1.5.6 | Self-hosted auth with built-in RBAC plugin, sessions in your DB. v1.5 adds `dash()` plugin for auth-specific audit logs (sign-ups, sign-ins, password changes) — complements but does not replace our custom `audit_logs` table for business events. TanStack Start integration via `tanstackStartCookies` plugin (must be last plugin). Auth checks via `beforeLoad` route guards + server function middleware (cache sessions with TanStack Query `staleTime` to avoid per-navigation round-trips) | NextAuth (limited RBAC), Firebase Auth (weak RBAC, vendor lock), Clerk (SaaS cost) |

### Database

| Technology | Purpose | Chosen Over |
|-----------|---------|-------------|
| **PostgreSQL 18** | Primary database — RLS for multi-tenancy, JSONB for flexible metadata, pgvector-ready for future AI | MySQL (no RLS), Firestore (no SQL/joins), MongoDB (no relational integrity) |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Vite** | Build tooling (bundled with TanStack Start). Tailwind CSS via `@tailwindcss/vite` plugin |
| **OpenTofu** | Infrastructure as Code for all GCP resources (open source Terraform fork, state encryption via GCP KMS) |
| **GitHub Actions** | CI/CD pipeline |
| **Docker** | Containerization for Cloud Run deployments |
| **pnpm** | Package management |

### PWA & Mobile

- **Manual PWA setup** — `vite-plugin-pwa` is incompatible with TanStack Start production builds (TanStack/router#4988, vite-pwa PR #786 unmerged). Using manual approach instead:
  - Static `public/manifest.webmanifest` (hand-written)
  - Post-build Workbox script (`workbox-build` `injectManifest`) for service worker generation
  - `useOnlineStatus` hook for offline indicator (pure React, uses `navigator.onLine`)
- Bottom navigation on mobile (leaderboard, points, notifications, profile)
- Offline indicator (not full offline mode — just shows "you're offline")
- Touch-friendly UI: larger tap targets, proper spacing, swipe gestures where appropriate
- Responsive breakpoints: mobile-first design, optimized for smartphones used by field employees
- No native app — PWA covers the use case without app store overhead
- **Note:** When `vite-plugin-pwa` merges Environment API support, migrate from manual approach to plugin

### Notifications

- In-app only (no email for notifications)
- Notification bell + unread count in header
- Backed by `notifications` database table

### Transactional Email (Auth Only)

- **Resend** (free tier: 100 emails/day) — used only for auth transactional emails:
  - Password reset links
  - (Future) Account invite emails
- Not used for notifications — those remain in-app only
- Resend API key stored in Secret Manager

---

## 3. GCP Resources

### GCP Project

**Project ID:** `fbi-dev-484410`

### Naming Convention

All GCP resources use the prefix `coms-aha-heroes-`.

### Core Services (Phase 1-3)

| Service | Resource Name | Purpose | Spec |
|---------|--------------|---------|------|
| **Cloud Run** | `coms-aha-heroes-app` | Next.js + Hono (single service) | 1 vCPU, 512MB, min 0 instances |
| **Cloud SQL** | `coms-aha-heroes-db` | PostgreSQL 18 (2 databases: `coms_aha_heroes_production` + `coms_aha_heroes_staging`) | db-f1-micro, 10GB SSD |
| **Cloud Storage** | `coms-aha-heroes-uploads` | File uploads (achievement evidence) | Standard storage |
| **Cloud Storage** | `coms-aha-heroes-exports` | Cached export files | Standard storage |
| **Cloud Storage** | `coms-aha-heroes-tfstate` | OpenTofu remote state | Standard storage |
| **Secret Manager** | `coms-aha-heroes-*` | DB credentials, OAuth secrets, Resend API key | < 10 secrets |
| **Cloud Scheduler** | `coms-aha-heroes-*` | Scheduled Sheets exports, report generation | 2-3 jobs |
| **Artifact Registry** | `coms-aha-heroes-registry` | Container images for Cloud Run | asia-southeast1 |
| **IAM** | `coms-aha-heroes-sa-*` | Service accounts for app + Sheets API | Free |
| **Cloud Logging** | Automatic | Application logs from Cloud Run | Included |
| **Cloud Monitoring** | `coms-aha-heroes-*` | Uptime checks + alert policies | Basic tier (free) |

### Google Workspace APIs

| API | Purpose |
|-----|---------|
| **Google Sheets API v4** | Import from / export to Google Sheets |
| **Google Drive API** | Create spreadsheets, manage file permissions |

### Future Services (Phase 4 — AI)

| Service | Purpose |
|---------|---------|
| **Vertex AI** | Text embeddings, LLM for auto-categorization |
| **BigQuery** | Trend analysis on historical data (if data volume justifies it) |
| **pgvector extension** | Vector similarity search on Cloud SQL PostgreSQL |

### Estimated Monthly Cost (100 users)

| Service | Est. Cost |
|---------|-----------|
| Cloud Run (1 service, scale-to-zero) | $5-15 |
| Cloud SQL (db-f1-micro) | $8-12 |
| Cloud Storage (< 1GB) | ~$0.02 |
| Secret Manager | ~$0.06 |
| Artifact Registry | ~$1-2 |
| Cloud Scheduler | Free tier |
| Logging / Monitoring | Free tier |
| **Total** | **~$15-30/month** |

### Region

**asia-southeast1 (Jakarta)** — Closest to Indonesia (majority of users). Acceptable latency (~30-40ms) to Thailand.

### Resource Cleanup Policies

Old revisions, images, and files accumulate over time. All cleanup is automated via OpenTofu configuration.

| Resource | What Lingers | Policy | Auto-Cleanup |
|----------|-------------|--------|-------------|
| **Artifact Registry** | Old Docker images (~200-500MB each) | Keep last 5 images, delete > 30 days | OpenTofu `cleanup_policies` |
| **Cloud Run** | Old revisions (0% traffic, minimal cost) | Keep last 10 revisions | `max-revisions=10` |
| **Cloud Storage (exports)** | Generated report files | Delete after 90 days | Lifecycle rule |
| **Cloud Storage (uploads)** | User-uploaded evidence files | Keep permanently | No auto-delete (user data) |
| **Cloud Storage (tfstate)** | OpenTofu state files | Keep permanently | No auto-delete (critical) |
| **Cloud SQL backups** | Automated daily backups | Retain 7 days | Built-in default |
| **Cloud Logging** | Application logs | Retain 30 days | Built-in default |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                GCP Project: fbi-dev-484410 (Single Billing)             │
│                        Region: asia-southeast1                          │
│                                                                         │
│  ┌──────────────┐       ┌──────────────────────────────────────────┐   │
│  │  Cloud CDN /  │       │     Cloud Run: coms-aha-heroes-app        │   │
│  │  Cloud LB     │──────>│     (asia-southeast1)                    │   │
│  │  (HTTPS)      │       │                                          │   │
│  └──────────────┘       │  ┌──────────────────────────────────┐    │   │
│                          │  │  Next.js 16 + Hono               │    │   │
│                          │  │  (SSR + RSC + API routes)        │    │   │
│                          │  │  Single container, Port 3000     │    │   │
│                          │  └──────────────┬───────────────────┘    │   │
│                          └─────────────────┼───────────────────────┘   │
│                                             │                          │
│                    ┌────────────────────────┤                          │
│                    │                        │                          │
│            ┌───────▼────────┐              ┌──────────▼───────────┐   │
│            │  Cloud SQL      │              │  Google APIs          │   │
│            │  PostgreSQL 18  │              │  - Sheets API v4     │   │
│            │  (db-f1-micro)  │              │  - Drive API         │   │
│            │                 │              │  - (Future: Vertex   │   │
│            │  RLS Enabled    │              │    AI API)            │   │
│            └─────────────────┘              └──────────────────────┘   │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  Cloud Storage    │  │  Cloud Scheduler  │  │  Secret Manager   │    │
│  │  - uploads        │  │  - sheet exports  │  │  - DB creds       │    │
│  │  - exports        │  │  - report gen     │  │  - OAuth secrets  │    │
│  │  - tfstate        │  │                   │  │  - API keys       │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │  Artifact         │  │  Cloud Monitoring │                           │
│  │  Registry         │  │  + Logging        │                           │
│  │  (Docker images)  │  │  (uptime, alerts) │                           │
│  └──────────────────┘  └──────────────────┘                            │
│                                                                         │
│  ┌──────────────────┐                                                   │
│  │  OpenTofu         │  (manages all of the above)                     │
│  │  State: GCS       │                                                  │
│  └──────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Monorepo Structure

```
coms_aha_heroes/
├── src/
│   ├── app/                        # Next.js 16 App Router
│   │   ├── [locale]/               # i18n routing (id, en, th)
│   │   │   ├── (auth)/             # login, register
│   │   │   ├── (dashboard)/        # main app layout (bottom nav on mobile)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── points/          # submissions, challenges, appeals
│   │   │   │   ├── leaderboard/     # Bintang + Poin AHA rankings
│   │   │   │   ├── rewards/         # catalog + redemption requests
│   │   │   │   ├── notifications/
│   │   │   │   ├── users/
│   │   │   │   ├── teams/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/        # admin: system settings, point impacts
│   │   │   │   └── admin/
│   │   │   └── layout.tsx
│   │   ├── api/                    # Next.js API routes → Hono
│   │   │   └── [...route]/
│   │   │       └── route.ts        # Hono catch-all handler
│   │   └── layout.tsx
│   ├── components/                 # UI components (shadcn/ui)
│   ├── lib/                        # utilities, api client
│   ├── server/                     # Backend (Hono)
│   │   ├── routes/                 # route handlers
│   │   ├── services/               # business logic
│   │   ├── repositories/           # data access (Drizzle)
│   │   ├── middleware/             # auth, branch guard, team, RLS
│   │   ├── jobs/                   # sheets sync, scheduled tasks
│   │   └── index.ts                # Hono app entry
│   ├── db/                         # Drizzle schema + migrations
│   │   ├── schema/                 # table definitions
│   │   ├── migrations/
│   │   └── seed/
│   ├── shared/                     # shared types, Zod schemas, constants
│   │   ├── schemas/                # Zod validation schemas
│   │   ├── types/                  # TypeScript interfaces
│   │   └── constants/              # enums, config values
│   └── messages/                   # i18n JSON files
│       ├── en.json
│       ├── id.json
│       └── th.json
│
├── infra/                          # OpenTofu
│   ├── modules/
│   │   ├── cloud-run/
│   │   ├── cloud-sql/
│   │   ├── storage/
│   │   ├── secrets/
│   │   ├── scheduler/
│   │   ├── artifact-registry/
│   │   ├── iam/
│   │   └── monitoring/
│   ├── envs/
│   │   ├── staging/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   └── production/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── terraform.tfvars
│   ├── backend.tf                  # GCS remote state
│   └── versions.tf
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # test + lint on PR
│       ├── deploy.yml              # build + deploy to Cloud Run
│       └── infra.yml               # tofu plan/apply
│
├── docs/
│   └── architecture.md             # this file
│
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker (offline indicator)
│   └── icons/                     # PWA icons (192x192, 512x512)
│
├── Dockerfile
├── next.config.ts
├── drizzle.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

---

## 6. Database Design

### Multi-Tenancy Strategy

**Shared Database + Row-Level Security (RLS)**

- Single PostgreSQL database with `branch_id` column on every tenant-scoped table
- PostgreSQL RLS enforces data isolation at the database level
- Even if application code has a bug, data cannot leak across branches
- Admin can query across branches; HR, Leaders, and Employees are restricted to their own branch

### Schema

```sql
-- ============================================================
-- BRANCHES (tenants)
-- ============================================================
CREATE TABLE branches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(10) NOT NULL UNIQUE,    -- 'ID', 'TH'
    name        VARCHAR(100) NOT NULL,           -- 'Indonesia', 'Thailand'
    timezone    VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    locale      VARCHAR(10) NOT NULL DEFAULT 'id',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
-- INSERT INTO branches (code, name, timezone, locale) VALUES
--     ('ID', 'Indonesia', 'Asia/Jakarta', 'id'),
--     ('TH', 'Thailand', 'Asia/Bangkok', 'th');

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id   UUID NOT NULL REFERENCES branches(id),
    name        VARCHAR(100) NOT NULL,
    leader_id   UUID,                             -- set via UPDATE after user creation (circular FK)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_teams_branch ON teams(branch_id);
CREATE INDEX idx_teams_leader ON teams(leader_id);

-- ============================================================
-- USERS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'leader', 'employee');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    team_id         UUID REFERENCES teams(id),       -- nullable; links employee to their team
    email           VARCHAR(255) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    employee_id     VARCHAR(50),                     -- external HR system ID
    role            user_role NOT NULL DEFAULT 'employee',
    department      VARCHAR(100),
    position        VARCHAR(100),
    avatar_url      TEXT,
    locale_pref     VARCHAR(10),                     -- user's preferred language
    must_change_password BOOLEAN NOT NULL DEFAULT true, -- true on account creation, false after first password change
    is_active       BOOLEAN NOT NULL DEFAULT true,
    archived_at     TIMESTAMPTZ,                     -- set when employee leaves (Archive policy)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_email ON users(email);

-- Resolve circular FK: teams.leader_id → users.id
ALTER TABLE teams ADD CONSTRAINT fk_teams_leader FOREIGN KEY (leader_id) REFERENCES users(id);

-- ============================================================
-- SYSTEM SETTINGS (admin-configurable)
-- ============================================================
CREATE TABLE system_settings (
    key             VARCHAR(100) PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
-- INSERT INTO system_settings (key, value, description) VALUES
--     ('bintang_point_impact', '10', 'Points added to Poin AHA per Bintang'),
--     ('penalti_point_impact', '5', 'Points deducted from Poin AHA per Penalti');

-- ============================================================
-- ACHIEVEMENT POINT CATEGORIES (4 fixed types)
-- ============================================================
CREATE TABLE point_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(50) NOT NULL UNIQUE CHECK (code IN ('BINTANG', 'PENALTI', 'POIN_AHA')),
    default_name    VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50),
    requires_screenshot BOOLEAN NOT NULL DEFAULT true,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed data
-- INSERT INTO point_categories (code, default_name, requires_screenshot) VALUES
--     ('BINTANG', 'Poin Bintang sAHAbat', true),
--     ('PENALTI', 'Poin Penalti Staff AHA', true),
--     ('POIN_AHA', 'Poin AHA', false);
-- Note: REDEEM is not a point category — redemptions use the separate `redemptions` table.
-- Point impact values (+10 for Bintang, -5 for Penalti) live in system_settings only.

-- i18n for category names
CREATE TABLE point_category_translations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID NOT NULL REFERENCES point_categories(id) ON DELETE CASCADE,
    locale          VARCHAR(10) NOT NULL,            -- 'id', 'en', 'th'
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    UNIQUE(category_id, locale)
);

-- ============================================================
-- ACHIEVEMENT POINTS (core transaction table)
-- ============================================================
-- Status state machine:
-- Leader/HR submit     → active (immediate)
-- Employee self-submit → pending → active (after Leader approval) or rejected
-- Any active point     → challenged (when someone files a challenge)
--                        Non-penalti: stays active during challenge
-- Penalti + appeal     → frozen (until HR resolves)
-- HR resolves          → active (upheld) or revoked
-- Admin/HR             → revoked (manual revocation at any time)
CREATE TYPE point_status AS ENUM ('pending', 'active', 'challenged', 'frozen', 'revoked', 'rejected');

CREATE TABLE achievement_points (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    user_id         UUID NOT NULL REFERENCES users(id),         -- employee receiving the points
    category_id     UUID NOT NULL REFERENCES point_categories(id),
    points          INTEGER NOT NULL CHECK (points > 0),        -- always positive; category determines add/subtract
                                                                 -- Bintang: always 1, Penalti: 1-10 (violation level), Poin AHA: 1-10 (level)
    reason          TEXT NOT NULL,                               -- Bintang: "[siapa] berkontribusi dalam [apa]"
                                                                 -- Penalti: "[siapa] [apa] sehingga [dampak]"
                                                                 -- Poin AHA: "[siapa] berpartisipasi dalam [apa]"
    related_staff   TEXT,                                        -- names of all staff involved (documentation only, not point recipients)
    screenshot_url  TEXT,                                        -- link to Cloud Storage (required for Bintang & Penalti, optional for Poin AHA)
    kitta_component VARCHAR(2),                                  -- Penalti only: 'K', 'I', 'T1', 'T2', 'A' (KITTA categories)
                                                                 -- NULL for non-Penalti submissions
    status          point_status NOT NULL DEFAULT 'pending',
    submitted_by    UUID NOT NULL REFERENCES users(id),          -- who submitted (Leader/HR/Employee)
    approved_by     UUID REFERENCES users(id),                   -- Leader who approved self-submissions
    approved_at     TIMESTAMPTZ,
    revoked_by      UUID REFERENCES users(id),
    revoked_at      TIMESTAMPTZ,
    revoke_reason   TEXT,
    metadata        JSONB DEFAULT '{}',                          -- flexible extra data
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- App logic enforces: kitta_component must be NOT NULL for PENALTI, NULL for others.
    CONSTRAINT chk_kitta_values CHECK (
        kitta_component IS NULL OR kitta_component IN ('K', 'I', 'T1', 'T2', 'A')
    )
);

CREATE INDEX idx_points_branch ON achievement_points(branch_id);
CREATE INDEX idx_points_user ON achievement_points(user_id);
CREATE INDEX idx_points_status ON achievement_points(status);
CREATE INDEX idx_points_category ON achievement_points(category_id);
CREATE INDEX idx_points_submitted_by ON achievement_points(submitted_by);
CREATE INDEX idx_points_created_at ON achievement_points(created_at);

-- ============================================================
-- CHALLENGES (only Penalti submissions can be challenged — by any Leader/Employee)
-- ============================================================
CREATE TABLE challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    achievement_id  UUID NOT NULL REFERENCES achievement_points(id),
    challenger_id   UUID NOT NULL REFERENCES users(id),
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'upheld', 'overturned')),
    resolved_by     UUID REFERENCES users(id),       -- HR who resolved
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenges_achievement ON challenges(achievement_id);
CREATE INDEX idx_challenges_branch ON challenges(branch_id);

-- ============================================================
-- APPEALS (Penalti only — affected employee appeals)
-- ============================================================
CREATE TABLE appeals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    achievement_id  UUID NOT NULL REFERENCES achievement_points(id),
    appellant_id    UUID NOT NULL REFERENCES users(id),   -- the penalized employee
    reason          TEXT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'upheld', 'overturned')),
    resolved_by     UUID REFERENCES users(id),       -- HR who resolved
    resolved_at     TIMESTAMPTZ,
    resolution_note TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appeals_achievement ON appeals(achievement_id);
CREATE INDEX idx_appeals_branch ON appeals(branch_id);
-- App logic enforces: only PENALTI category points can have appeals

-- ============================================================
-- COMMENTS (threaded discussion on submissions/challenges/appeals)
-- ============================================================
CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    entity_type     VARCHAR(30) NOT NULL
                    CHECK (entity_type IN ('achievement', 'challenge', 'appeal')),
    entity_id       UUID NOT NULL,                   -- polymorphic FK (no DB constraint)
    author_id       UUID NOT NULL REFERENCES users(id),
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_branch ON comments(branch_id);

-- ============================================================
-- REWARDS CATALOG (branch_id nullable = global reward available to all branches)
-- ============================================================
CREATE TABLE rewards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID REFERENCES branches(id),             -- NULL = available to all branches
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    point_cost      INTEGER NOT NULL CHECK (point_cost > 0),
    image_url       TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_branch ON rewards(branch_id);

-- No inventory tracking for now. HR buys on demand.

-- ============================================================
-- REDEMPTIONS (employee spends Poin AHA on rewards)
-- ============================================================
CREATE TYPE redemption_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE redemptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    reward_id       UUID NOT NULL REFERENCES rewards(id),
    points_spent    INTEGER NOT NULL CHECK (points_spent > 0),
    notes           TEXT,                              -- e.g., size for kaos/seragam AHA
    status          redemption_status NOT NULL DEFAULT 'pending',
    approved_by     UUID REFERENCES users(id),       -- HR who approved
    approved_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_redemptions_user ON redemptions(user_id);
CREATE INDEX idx_redemptions_branch ON redemptions(branch_id);

-- ============================================================
-- NOTIFICATIONS (in-app only)
-- ============================================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    user_id         UUID NOT NULL REFERENCES users(id),   -- recipient
    type            VARCHAR(50) NOT NULL,
    -- Types: 'submission_received', 'challenge_filed', 'appeal_filed',
    --        'challenge_resolved', 'appeal_resolved', 'redemption_approved',
    --        'redemption_rejected', 'self_submit_approved', 'self_submit_rejected'
    title           TEXT NOT NULL,
    body            TEXT,
    entity_type     VARCHAR(30),                          -- 'achievement', 'challenge', 'appeal', 'redemption'
    entity_id       UUID,                                 -- link to the relevant record
    is_read         BOOLEAN NOT NULL DEFAULT false,
    read_at         TIMESTAMPTZ,                         -- set when marked read; enables 90-day cleanup
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_read_cleanup ON notifications(read_at) WHERE is_read = true;
CREATE INDEX idx_notifications_branch ON notifications(branch_id);

-- ============================================================
-- POINT SUMMARY (materialized for leaderboard performance)
-- ============================================================
-- Tracks per-user totals. No period columns (periods never close).
-- Leaderboard uses bintang_count and poin_aha_balance.
-- Penalti is never shown on leaderboard.
CREATE TABLE point_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    user_id         UUID NOT NULL REFERENCES users(id) UNIQUE,
    bintang_count       INTEGER NOT NULL DEFAULT 0,      -- count of active Bintang awards (each = fixed impact)
    penalti_points_sum  INTEGER NOT NULL DEFAULT 0,      -- SUM of points from active Penalti (1-10 per submission, variable)
    direct_poin_aha     INTEGER NOT NULL DEFAULT 0,      -- sum of directly awarded Poin AHA (level 1-10)
    redeemed_total      INTEGER NOT NULL DEFAULT 0,      -- sum of approved redemptions
    -- poin_aha_balance is computed at query time:
    -- direct_poin_aha + (bintang_count × bintang_impact) - (penalti_points_sum × penalti_impact) - redeemed_total
    -- bintang_impact (default 10) and penalti_impact (default 5) from system_settings
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_point_summaries_leaderboard_bintang ON point_summaries(branch_id, bintang_count DESC);
CREATE INDEX idx_point_summaries_leaderboard_poin ON point_summaries(branch_id, direct_poin_aha DESC);

-- ============================================================
-- AUDIT LOG (immutable)
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    actor_id        UUID NOT NULL REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,              -- 'POINT_SUBMITTED', 'POINT_REVOKED', 'CHALLENGE_FILED', etc.
    entity_type     VARCHAR(50) NOT NULL,              -- 'achievement_points', 'challenges', 'appeals', etc.
    entity_id       UUID NOT NULL,
    old_value       JSONB,                             -- always snapshot actor info (name, email, role) here
    new_value       JSONB,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_branch ON audit_logs(branch_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================================
-- GOOGLE SHEETS SYNC TRACKING (deferred to Phase 3)
-- ============================================================
CREATE TABLE sheet_sync_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    direction       VARCHAR(10) NOT NULL CHECK (direction IN ('import', 'export')),
    sheet_id        VARCHAR(255) NOT NULL,
    sheet_name      VARCHAR(100),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    rows_processed  INTEGER DEFAULT 0,
    rows_failed     INTEGER DEFAULT 0,
    error_log       JSONB,
    started_by      UUID REFERENCES users(id),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DESIGN NOTES
-- ============================================================
-- 1. audit_logs.actor_id safety:
--    Always snapshot actor info (name, email, role) inside old_value/new_value
--    JSONB so the audit log remains self-contained if a user is later renamed
--    or archived.
--
-- 2. point_categories are global (no branch_id). All branches share the same
--    3 point types (BINTANG, PENALTI, POIN_AHA). REDEEM is not a category —
--    redemptions use the separate `redemptions` table.
--    Point impact values live in system_settings only (single source of truth).
--
-- 3. Soft delete / archive:
--    - Users: archived_at TIMESTAMPTZ set when employee leaves. Keep history,
--      remove from active views, auto-reject pending submissions.
--    - Achievement points: never physically deleted. Use 'revoked' status.
--    - Rewards: soft-delete via is_active = false.
--
-- 4. Challenges vs Appeals:
--    Separate tables because different authorization rules.
--    Challenge: Leaders only, Penalti submissions only. A Leader disputes
--    a Penalti given to someone (e.g., disagrees with the penalty).
--    Appeal: The penalized Employee only, on their own Penalti.
--    Bintang and Poin AHA cannot be challenged or appealed.
--    Both resolved by HR via comment threads.
--
-- 5. Point balance calculation (Poin AHA):
--    poin_aha_balance = direct_poin_aha
--                     + (bintang_count × system_settings['bintang_point_impact'])
--                     - (penalti_points_sum × system_settings['penalti_point_impact'])
--                     - redeemed_total
--    - Bintang: always 1 per submission, so bintang_count × 10 (default) = AHA impact
--    - Penalti: 1-10 points per submission (variable severity), so SUM × 5 (default) = AHA deduction
--    - Direct Poin AHA: 1-10 per submission (level), summed directly
--    Impact values are read from system_settings at query time.
--    Changing the value retroactively affects all historical balances (by design).
--
-- 6. Cross-branch nominations:
--    Currently disabled at app level. Schema supports it (branch_id on
--    achievement_points is the recipient's branch). To enable cross-branch,
--    relax the app-level restriction — no schema change needed.
--
-- 7. Polymorphic comments (entity_type + entity_id):
--    No DB-level FK on entity_id. Application code validates that entity_type
--    + entity_id reference a valid record. Simpler than 3 separate join tables.

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at column
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON achievement_points FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON appeals FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON redemptions FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
-- NOTE: These policies are illustrative. Verify with integration tests
-- before applying to production.

ALTER TABLE achievement_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_summaries ENABLE ROW LEVEL SECURITY;
-- rewards: RLS filters by branch (NULL branch_id = visible to all branches)
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY rewards_select ON rewards
    FOR SELECT
    USING (
        branch_id IS NULL  -- global rewards visible to everyone
        OR current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY rewards_manage ON rewards
    FOR ALL
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')
    );

-- Application sets these session variables per request:
--   SET app.current_user_id = '<uuid>';
--   SET app.current_branch_id = '<uuid>';
--   SET app.current_role = 'hr';       -- admin, hr, leader, employee
--   SET app.current_team_id = '<uuid>'; -- for leader team scoping

-- ── achievement_points ─────────────────────────────────────
CREATE POLICY ap_branch_isolation ON achievement_points
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY ap_select ON achievement_points
    FOR SELECT
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr', 'leader')
        OR user_id = current_setting('app.current_user_id', true)::UUID
    );

CREATE POLICY ap_insert ON achievement_points
    FOR INSERT
    WITH CHECK (
        -- employees insert only for themselves (status = pending)
        (current_setting('app.current_role', true) = 'employee'
            AND user_id = current_setting('app.current_user_id', true)::UUID)
        -- leaders and hr insert for any user in own branch (status = active)
        OR current_setting('app.current_role', true) IN ('admin', 'hr', 'leader')
    );

CREATE POLICY ap_update ON achievement_points
    FOR UPDATE
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')
        -- leaders can only update to approve/reject self-submissions from their team
        OR (current_setting('app.current_role', true) = 'leader'
            AND status = 'pending')
    );

-- No DELETE policy — use 'revoked' status instead

-- ── users ──────────────────────────────────────────────────
CREATE POLICY users_branch_isolation ON users
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY users_select ON users
    FOR SELECT
    USING (
        -- admin/hr/leader see all in their scope (branch_isolation handles branch)
        current_setting('app.current_role', true) IN ('admin', 'hr', 'leader')
        -- employees see own record + basic info of branch colleagues (for leaderboard)
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY users_update ON users
    FOR UPDATE
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')
    );

-- ── teams ──────────────────────────────────────────────────
CREATE POLICY teams_branch_isolation ON teams
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

-- ── challenges ─────────────────────────────────────────────
CREATE POLICY challenges_branch_isolation ON challenges
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY challenges_insert ON challenges
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM achievement_points ap
            WHERE ap.id = achievement_id
            AND ap.category = 'PENALTI'
        )
    );  -- only Penalti submissions can be challenged, by Leaders only

CREATE POLICY challenges_update ON challenges
    FOR UPDATE
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')  -- only HR resolves
    );

-- ── appeals ────────────────────────────────────────────────
CREATE POLICY appeals_branch_isolation ON appeals
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY appeals_insert ON appeals
    FOR INSERT
    WITH CHECK (
        -- only the penalized employee can appeal
        appellant_id = current_setting('app.current_user_id', true)::UUID
    );

CREATE POLICY appeals_update ON appeals
    FOR UPDATE
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')  -- only HR resolves
    );

-- ── comments ───────────────────────────────────────────────
CREATE POLICY comments_branch_isolation ON comments
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY comments_insert ON comments
    FOR INSERT
    WITH CHECK (true);  -- any authenticated user in branch can comment

CREATE POLICY comments_update ON comments
    FOR UPDATE
    USING (
        author_id = current_setting('app.current_user_id', true)::UUID  -- edit own comments only
    );

-- ── redemptions ────────────────────────────────────────────
CREATE POLICY redemptions_branch_isolation ON redemptions
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

CREATE POLICY redemptions_select ON redemptions
    FOR SELECT
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')
        OR user_id = current_setting('app.current_user_id', true)::UUID
    );

CREATE POLICY redemptions_insert ON redemptions
    FOR INSERT
    WITH CHECK (true);  -- any authenticated user can request a redemption

CREATE POLICY redemptions_update ON redemptions
    FOR UPDATE
    USING (
        current_setting('app.current_role', true) IN ('admin', 'hr')  -- only HR approves
    );

-- ── notifications ──────────────────────────────────────────
CREATE POLICY notifications_self_only ON notifications
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID
    );

CREATE POLICY notifications_update ON notifications
    FOR UPDATE
    USING (
        user_id = current_setting('app.current_user_id', true)::UUID  -- mark own as read
    );

-- ── audit_logs: append-only ────────────────────────────────
CREATE POLICY audit_insert ON audit_logs
    FOR INSERT
    WITH CHECK (true);  -- any authenticated user can generate audit events

CREATE POLICY audit_select ON audit_logs
    FOR SELECT
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR (current_setting('app.current_role', true) = 'hr'
            AND branch_id = current_setting('app.current_branch_id', true)::UUID)
    );

-- No UPDATE or DELETE policies on audit_logs (immutable by design)

-- ── point_summaries ────────────────────────────────────────
CREATE POLICY ps_branch_isolation ON point_summaries
    USING (
        current_setting('app.current_role', true) = 'admin'
        OR branch_id = current_setting('app.current_branch_id', true)::UUID
    );

-- All users in branch can read summaries (for leaderboard)
-- INSERT/UPDATE managed by DB trigger (SECURITY DEFINER)

-- ============================================================
-- TRIGGER: Sync point_summaries on achievement_points changes
-- ============================================================
CREATE OR REPLACE FUNCTION fn_sync_point_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- bypasses RLS to write to point_summaries
SET search_path = public  -- prevents schema hijacking with SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO point_summaries (branch_id, user_id, bintang_count, penalti_points_sum, direct_poin_aha)
    SELECT
        u.branch_id,
        u.id,
        COALESCE(COUNT(*) FILTER (WHERE pc.code = 'BINTANG' AND ap.status = 'active'), 0),
        COALESCE(SUM(ap.points) FILTER (WHERE pc.code = 'PENALTI' AND ap.status = 'active'), 0),
        COALESCE(SUM(ap.points) FILTER (WHERE pc.code = 'POIN_AHA' AND ap.status = 'active'), 0)
    FROM users u
    LEFT JOIN achievement_points ap ON ap.user_id = u.id
    LEFT JOIN point_categories pc ON pc.id = ap.category_id
    WHERE u.id = COALESCE(NEW.user_id, OLD.user_id)
    GROUP BY u.branch_id, u.id
    ON CONFLICT (user_id)
    DO UPDATE SET
        bintang_count       = EXCLUDED.bintang_count,
        penalti_points_sum  = EXCLUDED.penalti_points_sum,
        direct_poin_aha     = EXCLUDED.direct_poin_aha,
        updated_at          = now();

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_sync_point_summary
    AFTER INSERT OR UPDATE OF status OR DELETE
    ON achievement_points
    FOR EACH ROW
    EXECUTE FUNCTION fn_sync_point_summary();

-- redeemed_total is updated separately when redemptions are approved
CREATE OR REPLACE FUNCTION fn_sync_redeemed_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE point_summaries
    SET redeemed_total = (
        SELECT COALESCE(SUM(points_spent), 0)
        FROM redemptions
        WHERE user_id = NEW.user_id AND status = 'approved'
    ),
    updated_at = now()
    WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_redeemed_total
    AFTER UPDATE OF status
    ON redemptions
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION fn_sync_redeemed_total();
```

---

## 6b. File Upload Architecture

Screenshots are required for Bintang and Penalti submissions, optional for Poin AHA. All uploads go to the `coms-aha-heroes-uploads` Cloud Storage bucket.

### Upload Flow

```
Client (browser)
  │
  ├── 1. POST /api/v1/uploads/signed-url   → API generates signed upload URL
  │       { filename, contentType }          (valid 15 min, max 5MB)
  │
  ├── 2. PUT <signed-url>                   → Client uploads directly to Cloud Storage
  │       (bypasses Cloud Run — no bandwidth cost)
  │
  └── 3. POST /api/v1/points               → Submit achievement with screenshot_url
          { ..., screenshot_url }
```

### Constraints

| Property | Value |
|----------|-------|
| **Max file size** | 5MB |
| **Accepted MIME types** | `image/jpeg`, `image/png`, `image/webp` |
| **Client-side resize** | Max 1920px width before upload (reduces storage, speeds loading) |
| **Bucket access** | Private (uniform bucket-level access, no public URLs) |
| **Serving method** | Short-lived signed URLs (15 min expiry) generated on demand |
| **Path format** | `uploads/{branch_id}/{year}/{month}/{uuid}.{ext}` |

### Security

- Bucket is **not public** — all access via signed URLs
- Signed upload URLs are scoped to specific object path and content type
- Signed read URLs expire after 15 minutes — even if shared, they stop working
- No virus scanning needed (images only, rendered in `<img>` tags, not executed)

---

## 7. Authentication & Authorization

### Auth Provider: Better Auth

- Self-hosted — all session data stored in our PostgreSQL
- Built-in RBAC plugin for role management
- Phase 1: email/password only
- Phase 3: add Google OAuth
- TypeScript-native, runs on any runtime

### Session Configuration

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24,      // refresh daily on activity
}
```

- **7-day sliding window** — active users stay logged in indefinitely
- **Inactive for > 7 days** — must re-authenticate (e.g., returning from vacation)
- Practical for an internal tool used daily by ~100 employees

### Account Creation & Management

**Account creation** is admin/HR-only — no self-registration.

```
HR/Admin creates user via POST /users
  │
  ├── 1. Backend creates Better Auth account (email + temp password)
  ├── 2. Backend creates `users` row (branch, team, role, department, etc.)
  │      Same UUID used for both (linked by ID)
  ├── 3. User record marked `must_change_password = true`
  │
  └── Employee logs in with temp password
       │
       └── Middleware detects `must_change_password = true`
            → Redirects to "Set your password" screen
            → After password change, `must_change_password = false`
            → Normal app access
```

**Bulk import:** Phase 3 Google Sheets import includes employee list import (name, email, branch, team, role). System generates temp passwords and creates accounts in batch.

**Password reset:** Better Auth's built-in `forgetPassword` plugin + Resend (free tier) for sending reset emails. Flow:
1. Employee clicks "Forgot password" on login page
2. `POST /auth/forgot-password` → Better Auth sends reset link via Resend
3. Employee clicks link → `POST /auth/reset-password` with token + new password

**Account archiving:** `POST /users/:id/archive` sets `archived_at`, auto-rejects pending submissions, and deactivates the Better Auth account (prevents login).

### Roles

| Role | Who | Scope | Description |
|------|-----|-------|-------------|
| `admin` | Developer (1 person) | All branches | Full system access, manage system settings, branches, categories |
| `hr` | HR department | Own branch | Nominate anyone in branch, resolve challenges/appeals, approve redemptions, manage rewards catalog, can be challenged |
| `leader` | Team leads | Own branch (team-scoped for approvals) | Nominate any employee in branch, approve own team's self-submissions, challenge Penalti submissions (Leaders only), see all detailed points |
| `employee` | Staff | Own data + leaderboard | View own points, self-submit (needs Leader approval), appeal penalties, challenge submissions, request redemptions |

### Authorization Matrix

| Action | Admin | HR | Leader | Employee |
|--------|-------|-----|--------|----------|
| View all branches | Yes | No | No | No |
| View own branch users | Yes | Yes | Yes | Leaderboard only |
| View all detailed points | Yes | Yes | Yes | Own only |
| View leaderboard (Bintang + Poin AHA) | Yes | Yes | Yes | Yes |
| Submit Bintang/Penalti/Poin AHA | Yes | Yes (any in branch) | Yes (any in branch) | Self only (pending) |
| Approve employee self-submissions | Yes | Yes | Own team only | No |
| Challenge a submission | Yes | Yes | Yes | Yes |
| Appeal a Penalti | No | No | No | Own penalties only |
| Resolve challenges/appeals | Yes | Yes | No | No |
| Revoke points | Yes | Yes | No | No |
| Request redemption | Yes | Yes | Yes | Yes |
| Approve redemptions | Yes | Yes | No | No |
| Manage rewards catalog | Yes | Yes | No | No |
| Manage users | Yes | Yes (own branch) | No | No |
| Manage teams | Yes | Yes (own branch) | No | No |
| View audit log | Yes | Yes (own branch) | No | No |
| Manage system settings | Yes | No | No | No |
| Manage categories | Yes | No | No | No |
| Manage branches | Yes | No | No | No |
| Import/export sheets | Yes | Yes (own branch) | No | No |
| Add comments | Yes | Yes | Yes | On own submissions/challenges/appeals |

### Middleware Chain

```
Request
  │
  ├── 1. authMiddleware()       → Verify session (Better Auth)
  ├── 2. branchMiddleware()     → Resolve user's branch context
  ├── 3. teamMiddleware()       → Resolve user's team (for leader scoping)
  ├── 4. rbacMiddleware()       → Check role + branch + team permissions
  └── 5. SET LOCAL app.* vars   → PostgreSQL RLS session variables
                                   (app.current_user_id, app.current_branch_id,
                                    app.current_role, app.current_team_id)
```

> **Important:** All RLS session variables MUST use `SET LOCAL` within a transaction (not `SET`). `SET LOCAL` scopes variables to the current transaction only, preventing variable leakage across pooled connections. Each request wraps its database operations in a transaction where `SET LOCAL` is called first.

---

## 8. API Design

### Approach: REST + Hono RPC

RESTful resource naming with Hono RPC client for end-to-end TypeScript type safety. No code generation needed.

### Endpoints

```
Base URL: /api/v1

# Authentication
POST   /auth/login                   (email/password)
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
POST   /auth/change-password         { currentPassword, newPassword } (clears must_change_password)
POST   /auth/forgot-password         { email } (sends reset link via Resend)
POST   /auth/reset-password          { token, newPassword }
POST   /auth/google                  (Google OAuth — Phase 3)

# Users (hr/admin)
GET    /users                        ?branch_id=&team_id=&department=&is_active=&page=&limit=
GET    /users/:id
POST   /users
PATCH  /users/:id
POST   /users/:id/archive            (soft archive — keep history, auto-reject pending)

# Teams (hr/admin)
GET    /teams                        ?branch_id=
GET    /teams/:id
POST   /teams
PATCH  /teams/:id
DELETE /teams/:id

# Achievement Points
GET    /points                       ?user_id=&category=&status=&type=&page=&limit=
GET    /points/:id
POST   /points                       (submit — status depends on submitter role)
PATCH  /points/:id/approve           (leader: own team self-subs; hr/admin: any)
PATCH  /points/:id/reject            (leader: own team self-subs; hr/admin: any)
PATCH  /points/:id/revoke            (hr/admin only, with reason)

# Challenges (any Leader/Employee can file)
GET    /points/:id/challenges
POST   /points/:id/challenges        { reason } (file a challenge)
PATCH  /challenges/:id/resolve       { status, resolution_note } (hr only — upheld or overturned)

# Appeals (Penalti only — affected employee)
GET    /points/:id/appeals
POST   /points/:id/appeals           { reason } (employee appeals own penalty)
PATCH  /appeals/:id/resolve          { status, resolution_note } (hr only — upheld or overturned)

# Comments (on achievements, challenges, appeals)
GET    /comments                     ?entity_type=&entity_id=
POST   /comments                     { entity_type, entity_id, body }
PATCH  /comments/:id                 { body } (own comments only)

# File Uploads (signed URL for direct Cloud Storage upload)
POST   /uploads/signed-url           { filename, contentType } → returns { uploadUrl, objectPath }

# Leaderboard (all authenticated users)
GET    /leaderboard                  ?branch_id=&team_id=&type=bintang|poin_aha&page=&limit=

# Rewards Catalog
GET    /rewards                      (all authenticated users)
POST   /rewards                      (hr/admin)
PATCH  /rewards/:id                  (hr/admin)
DELETE /rewards/:id                  (hr/admin — soft delete)

# Redemptions
GET    /redemptions                  ?user_id=&status=&page=&limit=
POST   /redemptions                  { reward_id, notes? } (employee/leader requests)
PATCH  /redemptions/:id/approve      (hr/admin)
PATCH  /redemptions/:id/reject       (hr/admin, with reason)

# Notifications (own notifications only)
GET    /notifications                ?is_read=&page=&limit=
PATCH  /notifications/:id/read
PATCH  /notifications/read-all

# System Settings (admin only)
GET    /settings
PATCH  /settings/:key               { value }

# Categories (admin only)
GET    /categories
POST   /categories
PATCH  /categories/:id

# Dashboard / Reports
GET    /dashboard/summary            ?branch_id=
GET    /dashboard/by-category        ?branch_id=

# Google Sheets Integration (deferred to Phase 3)
POST   /sheets/import                { sheetId, sheetName, mappingConfig }
POST   /sheets/export                { reportType, branchId }
GET    /sheets/jobs
GET    /sheets/jobs/:id

# Admin
GET    /admin/audit-log              ?branch_id=&actor=&action=&from=&to=
GET    /admin/branches
PATCH  /admin/branches/:id

# Health Check (outside /api/v1 — not versioned)
GET    /api/health                   (no auth — Cloud Run readiness probe; checks DB connectivity)
```

### Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## 9. Internationalization (i18n)

### Three-Layer Approach

#### Layer 1 — UI Strings (next-intl)

JSON translation files per locale:

```
src/messages/
  ├── en.json    # English (default fallback)
  ├── id.json    # Bahasa Indonesia
  └── th.json    # Thai
```

ICU message format for pluralization, interpolation:

```json
{
  "dashboard.totalPoints": "Total Points",
  "points.status.pending": "Pending",
  "points.period": "Period: Q{quarter} {year}"
}
```

#### Layer 2 — Database Content (translation tables)

Entities like `point_categories` have companion `_translations` tables. API returns the translation matching the user's locale, with English fallback.

#### Layer 3 — Date/Number/Currency Formatting

Use built-in `Intl` API (zero-dependency):

- `Intl.DateTimeFormat(locale)` for dates
- `Intl.NumberFormat(locale)` for numbers

#### Locale Resolution Order

1. User preference in DB (`users.locale_pref`)
2. Browser `Accept-Language` header
3. Branch default locale
4. Fallback: `en`

#### Adding New Languages

1. Add a new JSON file in `src/messages/` (e.g., `ja.json`)
2. Add translation rows in `_translations` tables
3. Add locale to next-intl config
4. Done — no code changes needed

#### RTL Preparedness

- Use CSS logical properties (`margin-inline-start` vs `margin-left`)
- Tailwind CSS 4 supports logical properties natively
- `dir` attribute support in layout component
- Zero cost now, ready if needed later

---

## 10. Google Sheets Integration

### Authentication

GCP Service Account with domain-wide delegation:

1. Create service account in GCP project
2. Enable Google Sheets API v4 + Google Drive API
3. Share target spreadsheets with service account email
4. Store service account key in Secret Manager

### Import Flow (Google Sheets → DB)

```
Admin UI (select sheet, map columns)
    │
    ▼
Sheets Service
    ├── 1. Read sheet data via Sheets API v4
    ├── 2. Map columns using admin-defined mapping
    ├── 3. Validate each row with Zod schemas
    ├── 4. Separate valid / invalid rows
    ├── 5. Upsert valid rows in a DB transaction
    └── 6. Update sync job status + error report
```

### Export Flow (DB → Google Sheets)

```
Admin UI (select report type, period, branch)
    │
    ▼
Sheets Service
    ├── 1. Query data based on report type + filters
    ├── 2. Format as array-of-arrays for Sheets API
    ├── 3. Create new sheet or update existing
    ├── 4. Write data via Sheets API v4
    └── 5. Apply formatting (headers, column widths)
```

### Scheduled Exports

Cloud Scheduler triggers periodic exports (e.g., weekly/quarterly reports) to predefined Google Sheets.

---

## 11. Infrastructure as Code (OpenTofu)

### Structure

```
infra/
├── modules/
│   ├── cloud-run/              # Cloud Run service definitions
│   ├── cloud-sql/              # PostgreSQL instance + databases
│   ├── storage/                # GCS buckets
│   ├── secrets/                # Secret Manager secrets
│   ├── scheduler/              # Cloud Scheduler jobs
│   ├── artifact-registry/      # Docker image repository
│   ├── iam/                    # Service accounts + IAM bindings
│   └── monitoring/             # Uptime checks + alert policies
├── envs/
│   ├── staging/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
├── backend.tf                  # GCS remote state
└── versions.tf
```

### Remote State

```hcl
terraform {  # OpenTofu uses the same HCL syntax and block names
  backend "gcs" {
    bucket = "coms-aha-heroes-tfstate"
    prefix = "tofu/state"
  }
}
```

### Environment Strategy

```
Cloud SQL Instance: coms-aha-heroes-db
  ├── Database: coms_aha_heroes_production    ← production traffic
  └── Database: coms_aha_heroes_staging       ← staging tagged URL (zero extra cost)
```

| Environment | Database | Cloud Run | URL | Purpose |
|------------|----------|-----------|-----|---------|
| `dev` | Local Docker PostgreSQL | `pnpm dev` | localhost:3000 | Local development |
| `staging` | Cloud SQL → `coms_aha_heroes_staging` | Cloud Run revision (0% traffic, tagged "staging") | `staging---coms-aha-heroes-app-xxxxx.run.app` | Test new features safely — only accessible via tagged URL |
| `production` | Cloud SQL → `coms_aha_heroes_production` | Cloud Run revision (100% traffic) | `coms-aha-heroes-app-xxxxx.run.app` | Live users |

**Key: staging and production use separate databases on the same Cloud SQL instance.** New code cannot corrupt production data during testing.

> **Deployment detail:** Staging and production are two separate Cloud Run revisions
> deployed from the same Docker image but with **different environment variables**
> (primarily `DATABASE_URL`). The staging revision is deployed first with
> `DATABASE_URL` pointing to `coms_aha_heroes_staging`. After approval, a second
> `gcloud run deploy` creates the production revision with `DATABASE_URL` pointing
> to `coms_aha_heroes_production`. They are independent revisions, not one revision
> connecting to two databases.

### Cloud SQL Built-In Safety Nets

| Feature | What It Does | Cost |
|---------|-------------|------|
| Automated daily backups | Full backup every day, retained 7 days | Included |
| Point-in-time recovery | Restore to any second in the last 7 days | Included |
| On-demand backup | Snapshot before risky deploys | Included |

---

## 12. CI/CD Pipeline

### Zero-Downtime Deployment Strategy

Users are never disturbed by new deployments. New code is deployed as a Cloud Run revision with **0% traffic** and a "staging" tag. The team tests via the tagged URL. Only after approval does traffic shift 100% to the new revision.

```
PR merged to main
      │
      ▼
Build Docker image → Push to Artifact Registry
      │
      ▼
Deploy to Cloud Run (0% traffic, tag: "staging")
connects to: coms_aha_heroes_staging database
      │
      ▼
Team tests via tagged URL
      │
  ┌───┴────┐
  │        │
Pass     Fail
  │        │
  ▼        ▼
Shift    Delete revision
100%     (users never saw it)
traffic
to new
revision
```

### GitHub Actions Workflows

#### 1. On Pull Request — `ci.yml`

Runs on every PR. **All checks must pass before merge is allowed.**

```
PR opened / updated
  │
  ├── 1. Checkout code
  ├── 2. Setup Node.js + pnpm (with cache)
  ├── 3. Install dependencies (pnpm install --frozen-lockfile)
  ├── 4. Lint (ESLint + Prettier)
  ├── 5. Type check (tsc --noEmit)
  ├── 6. Unit tests + integration tests
  ├── 7. Build (next build) — catches build errors early
  └── 8. Post results as PR comment

  ❌ If ANY step fails → PR cannot be merged (branch protection)
```

#### 2. On Merge to Main (src/ changed) — `deploy.yml`

```
Merge to main
  │
  ├── 1. Checkout code
  ├── 2. Run full test suite
  ├── 3. Run Drizzle migrations (drizzle-kit migrate)
  │      └── Against coms_aha_heroes_staging via Cloud SQL Auth Proxy
  │      └── Expand-contract pattern for zero-downtime schema changes:
  │           Phase 1 deploy: ADD new column (nullable), deploy code that writes both
  │           Phase 2 deploy: Backfill, make NOT NULL, remove old column reads
  ├── 4. Build Docker image
  ├── 5. Push to Artifact Registry
  ├── 6. Deploy staging revision (0% traffic, tag: "staging")
  │      └── ENV: DATABASE_URL=coms_aha_heroes_staging
  │      └── This is a distinct Cloud Run revision for staging
  ├── 7. Run smoke tests against staging tagged URL
  ├── 8. ── Manual approval gate ──
  ├── 9. Run Drizzle migrations against coms_aha_heroes_production
  ├── 10. Deploy production revision (same image, different env vars)
  │      └── ENV: DATABASE_URL=coms_aha_heroes_production
  │      └── Shift 100% traffic to this new production revision
  └── 11. Verify health checks pass

  🔄 Rollback: gcloud run services update-traffic --to-revisions=PREVIOUS=100
```

#### 3. On Merge to Main (infra/ changed) — `infra.yml`

```
Merge to main (infra/ files)
  │
  ├── 1. tofu plan → post diff as PR comment
  ├── 2. ── Manual approval gate ──
  └── 3. tofu apply
```

#### 4. Weekly Schedule — `audit.yml`

```
Every Monday (cron)
  │
  ├── 1. Dependency audit (pnpm audit)
  ├── 2. Security scan
  └── 3. Report via email/Slack
```

### Branch Protection Rules (main)

| Rule | Setting |
|------|---------|
| Require PR before merge | Yes |
| Require CI checks to pass | Yes (ci.yml) |
| Require at least 1 review | Yes (if team > 1) |
| No direct push to main | Yes |
| Require up-to-date branch | Yes |

### Branching Strategy

```
main (protected — production)
  │
  ├── feature/add-leaderboard       ← new feature
  ├── feature/sheets-import         ← new feature
  ├── fix/point-calculation          ← bug fix
  └── chore/update-dependencies      ← maintenance

All changes merge via PR → CI runs → review → merge → auto-deploy to staging
```

### Future CI/CD Enhancements (Add When Needed)

| Enhancement | When to Add |
|-------------|------------|
| E2E tests (Playwright) | When critical user flows are worth automating (Phase 3) |
| Performance/load testing | When approaching 500+ users |
| Database migration safety check | Integrated — Drizzle migrations run in deploy pipeline with expand-contract pattern |
| Slack/LINE notifications on deploy | When team grows beyond 2-3 people |
| Staging data sync from production | When staging data divergence becomes a testing issue |

---

## 13. Future AI Integration

### Preparation Already in Architecture

| What | How It Enables AI |
|------|-------------------|
| PostgreSQL (not Firestore) | Can add `pgvector` extension without migrating |
| `metadata JSONB` column | Store AI tags, classification scores without schema change |
| `audit_logs` table | Training data for approval pattern learning |
| Hono middleware chain | Insert AI middleware (auto-classify) without changing routes |
| Project structure | Add separate `ai-worker/` Cloud Run service when needed |
| GCP hosting | Vertex AI is native, same VPC, no cross-cloud networking |

### Planned AI Features (Phase 4)

1. **Auto-categorization** — Suggest category for new achievement submissions using LLM
2. **Achievement recommendations** — "Employees similar to you also earned..." via pgvector embeddings
3. **Trend analysis** — Department performance patterns, seasonal trends, anomaly detection
4. **Smart approval suggestions** — Learn from past approval/rejection patterns

### Implementation Path

1. Add `pgvector` extension to Cloud SQL
2. Create `apps/ai-worker/` Cloud Run service
3. Generate embeddings for achievement descriptions via Vertex AI
4. Store in `achievement_embeddings` table
5. Use cosine similarity for recommendation queries

---

## 14. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1-4)

| Week | Deliverables |
|------|-------------|
| 1 | Project setup, OpenTofu infra provisioning, Cloud SQL + Drizzle schema (all tables including teams, rewards, system_settings), CI/CD pipeline, PWA manifest + service worker |
| 2 | Better Auth integration (email/password), RBAC middleware for 4 roles (admin/hr/leader/employee), branch guard, team middleware, RLS policies for all tables |
| 3 | Users CRUD, Teams CRUD, Point Categories setup (4 types seeded), Achievement Points submission (immediate-active for leader/hr, pending for employee self-submit) |
| 4 | Leader approval of self-submissions, basic leaderboard (Bintang + Poin AHA, filterable by team), mobile-responsive layout with bottom navigation, deploy to Cloud Run staging |

**Exit Criteria:** HR/Leader can submit points (immediately active). Employee can self-submit (pending until Leader approves). Leaderboard shows Bintang and Poin AHA rankings. App works on mobile (PWA installable).

### Phase 2 — Core Features (Weeks 5-8)

| Week | Deliverables |
|------|-------------|
| 5 | Challenge system (file with reason, HR resolve), Appeal system for Penalti (employee appeals, points frozen, HR resolve), comment threads on submissions/challenges/appeals |
| 6 | Rewards catalog CRUD (HR manages), Redemption request + HR approval flow, Poin AHA balance calculation (direct + Bintang impact - Penalti impact - redeemed) |
| 7 | In-app notification system (submission received, challenge/appeal filed, resolved, redemption approved/rejected), notification bell + list UI |
| 8 | i18n implementation (ID, EN, TH), locale switching, date/number formatting, admin settings page (configurable point impact values), production deployment |

**Exit Criteria:** Full challenge/appeal workflow working. Rewards and redemptions operational. In-app notifications functional. App works in 3 languages.

### Phase 3 — Polish & Scale (Weeks 9-12)

| Week | Deliverables |
|------|-------------|
| 9 | Google Sheets import (historical data migration), column mapping UI, validation + error reporting |
| 10 | Google Sheets export, audit log viewer, advanced filtering/search, bulk operations (hr/admin), Google OAuth login |
| 11 | Performance optimization, monitoring setup, load testing, mobile UX polish (touch targets, swipe gestures, offline indicator) |
| 12 | UAT, documentation, training materials, production go-live |

**Exit Criteria:** App in production use by both branches. Historical data migrated. Google Sheets workflow fully replaced.

### Phase 4 — AI Features (Weeks 13-16, optional)

| Week | Deliverables |
|------|-------------|
| 13 | pgvector setup, embedding pipeline |
| 14 | Auto-categorization suggestions |
| 15 | Trend analysis dashboard |
| 16 | Recommendation engine, anomaly detection |

---

## 15. Decision Log

| # | Decision | Chosen | Rejected | Rationale |
|---|----------|--------|----------|-----------|
| 1 | Frontend framework | TanStack Start v1 | Next.js 16, Nuxt | TanStack Start now stable v1 with official Paraglide i18n + shadcn/ui support; type-safe routing + search params; lighter runtime; Hono embedded via API wildcard route. Previously chose Next.js when Start was beta — revisited 2026-03-26 |
| 2 | Backend framework | Hono (TypeScript) | FastAPI (Python), Express, NestJS | Shared language with frontend = shared types/schemas; fastest cold starts on Cloud Run; Hono RPC for e2e type safety |
| 3 | Database | PostgreSQL 18 | MySQL, Firestore, MongoDB | RLS for multi-tenancy, pgvector for future AI, JSONB for flexible metadata, strongest SQL features |
| 4 | Multi-tenancy | Shared DB + RLS | Separate DBs, Schema-per-tenant | 2 branches doesn't justify operational complexity; RLS enforces isolation at DB level |
| 5 | Auth | Better Auth | NextAuth, Firebase Auth, Clerk | Self-hosted (data in own DB), TypeScript-native RBAC, no SaaS cost, stays within GCP |
| 6 | ORM | Drizzle | Prisma, TypeORM, SQLAlchemy | No binary engine (fast cold starts), SQL-level control, type-safe without codegen |
| 7 | Hosting | Cloud Run (single service) | GKE, App Engine, Compute Engine, Firebase Hosting | Scale-to-zero = cheapest for 100 users; simplest ops; no K8s overhead; single service sufficient at this scale |
| 8 | i18n | Paraglide JS | next-intl, i18next, Lingui, typesafe-i18n | Official TanStack Start integration with built-in locale routing + SSR middleware; compile-time typed functions (~2KB vs i18next 22KB); ICU via plugin. Previously chose next-intl (Next.js-specific) — revisited 2026-03-26 |
| 9 | API style | REST + Hono RPC | GraphQL, tRPC | REST is simpler for CRUD-heavy app; Hono RPC gives type safety without GraphQL complexity |
| 10 | IaC | OpenTofu | Terraform (BSL license), Pulumi, gcloud CLI scripts | Fully open source (MPL 2.0), same HCL syntax as Terraform, built-in state encryption via GCP KMS, Linux Foundation governance |
| 11 | Project structure | Single TanStack Start project | Turborepo monorepo, separate repos | Single service = no need for monorepo tooling; simpler DX; split later if needed |
| 12 | GCP region | asia-southeast1 (Jakarta) | asia-southeast2 (Singapore) | Majority of users in Indonesia; acceptable latency (~30-40ms) to Thailand |
| 13 | Role system | 4 roles (admin, hr, leader, employee) | 3 roles (super_admin, admin, employee) | Need distinct Leader (team-scoped approval) and HR (branch-scoped resolution) roles; admin is developer-only |
| 14 | Point activation | Immediate-active (Leader/HR submit) | Approval-first | Reduces friction; challenges/appeals handle disputes after the fact |
| 15 | Challenge/Appeal model | Separate tables | Single dispute table | Different authorization rules (anyone can challenge, only penalized employee can appeal); clearer data model |
| 16 | Notifications | In-app only | Email (SendGrid/Resend) | ~100 users, all internal; email adds cost and complexity with no clear benefit at this scale |
| 17 | Point periods | No periods (open-ended) | Quarterly periods | Business decided periods never close; simplifies schema and queries |
| 18 | Redemptions | HR-approved, no inventory | Auto-approve, with inventory | Small scale; HR wants manual control over reward fulfillment |
| 19 | Cross-branch nominations | Disabled (schema supports future) | Enabled now | Not needed yet; branch_id on achievement_points allows future cross-branch if needed |
| 20 | Employee departure | Archive (keep history) | Hard delete | Audit trail and historical leaderboard integrity require keeping data |
| 21 | Point impact values | Configurable via system_settings | Hardcoded | Business wants flexibility to change +10/-5 values without code deploy |
| 22 | Leaderboard visibility | All employees (Bintang + Poin AHA only) | Leaders/HR only | Transparency motivates employees; hide Penalti to avoid public shaming |
| 23 | Comment system | Polymorphic (entity_type + entity_id) | Separate tables per entity | Fewer tables, simpler queries, same authorization pattern for all comment contexts |
| 24 | Mobile experience | PWA + responsive design | Native app, responsive-only | PWA gives add-to-home-screen + offline indicator without app store overhead; Tailwind + shadcn already mobile-friendly |
| 25 | Point impact retroactivity | Retroactive (query-time calculation) | Snapshot at award time | Simpler: balance always = f(system_settings, counts). Changing impact value updates all balances instantly. |
| 26 | Reward catalog i18n | No translation tables | reward_translations table | Rewards data from Google Sheets; Thailand branch not yet established — add later if needed |
| 27 | Leader self-submission | Not allowed | Allowed (HR approves) | Leaders cannot give themselves points. Leader A can give Leader B. HR can give anyone. |
| 28 | Multiple challengers | Allowed | One challenge per submission | Multiple people can challenge the same point; HR resolves once for all challengers |
| 29 | Notification retention | 90-day auto-cleanup for read | Keep forever, manual cleanup | Prevents table bloat; 90 days sufficient for historical reference |
| 30 | Production DB tier | db-f1-micro (shared vCPU, 614MB) | db-custom-1-3840 | Sufficient for ~100 users; lowest cost; upgrade later if needed |
| 31 | File upload method | Signed URLs to Cloud Storage | Proxy through Cloud Run | Direct upload avoids bandwidth cost on Cloud Run; signed URLs keep bucket private |
| 32 | Session duration | 7-day sliding window | 8-hour fixed, 30-day default | 8h forces daily login (annoying); 30d too long for HR data; 7d sliding = practical balance |
| 33 | Rewards branch scope | Nullable branch_id on rewards | Global-only rewards | Thailand may need different catalog/pricing; nullable = global by default, branch-specific when needed |
| 34 | Orphaned pending submissions | Escalate to HR | Auto-reassign to new leader, reject | HR already has branch-wide approval; simplest to implement, no extra code needed |
| 35 | RLS variable scoping | SET LOCAL within transactions | SET (session-level) | SET LOCAL prevents variable leakage across pooled connections; critical for data isolation |
| 36 | Point impact source of truth | system_settings only | point_categories.point_impact column | Single source prevents drift; admin UI edits system_settings; removed point_impact from point_categories |
| 37 | REDEEM as point category | Removed from seed data | Keep as 4th category | Redemptions use separate `redemptions` table; REDEEM category was never referenced in achievement_points |
| 38 | SECURITY DEFINER search_path | SET search_path = public | No search_path | Prevents schema hijacking; PostgreSQL best practice for SECURITY DEFINER functions |
| 39 | updated_at auto-trigger | Database trigger (fn_set_updated_at) | Application-level via Drizzle | Trigger is foolproof — works for app code, migrations, and manual SQL fixes |
| 40 | Account creation | HR/Admin only (no self-registration) | Self-registration | Internal tool; HR controls who gets access; temp password + force change on first login |
| 41 | Password reset email | Resend (free tier) | No email, SendGrid, SES | Need email for password reset; Resend free tier (100/day) is sufficient; minimal setup; not used for notifications |
| 42 | Self-registration removed | No `/auth/register` endpoint | Allow self-registration | Internal HR tool; all accounts created by HR/Admin; prevents unauthorized access |
| 43 | Backend API integration | Hono embedded in TanStack Start (API wildcard) | Server functions only, separate Hono service | Keep existing Hono middleware chains (auth, RLS, RBAC, uploads) intact; server functions lack streaming uploads + OpenAPI; single container avoids infra complexity. Use server functions selectively for SSR loaders + simple mutations |
| 44 | Client state | Keep Zustand | TanStack Store | TanStack Store is pre-1.0 (v0.9); Zustand is stable with persist middleware; client state is minimal (theme, sidebar) — low impact either way |
| 45 | PWA tooling | Manual (static manifest + Workbox post-build) | vite-plugin-pwa, Serwist | vite-plugin-pwa incompatible with TanStack Start production builds (issue #4988); manual approach is reliable for minimal PWA needs (A2HS + offline indicator) |
| 46 | Build tooling | Vite (bundled with TanStack Start) | Turbopack (Next.js) | Vite is TanStack Start's bundler; Tailwind via `@tailwindcss/vite`; mature plugin ecosystem |
| 47 | Challengeable submissions | Penalti only, by Leaders only | Any submission by anyone | Bintang is positive recognition — no reason to dispute. Poin AHA is direct points — same. Only Penalti (negative) warrants a challenge by a Leader. Penalized employees use Appeal instead. Enforced via RLS policy on challenges table |

---

## 16. Open Questions

> Resolved questions have been moved to the Decision Log (Section 15).

| # | Question | Context |
|---|----------|---------|
| 1 | What happens to pending submissions when a Leader leaves? | Self-submissions awaiting Leader approval become orphaned. **Proposed:** escalate to HR automatically (HR already has branch-wide approval permissions). |
| 2 | How are `system_settings` changes audited? | Changing `bintang_point_impact` retroactively recalculates all balances. Must log old/new values to `audit_logs`. Consider UI confirmation showing number of affected employees before applying. |

### Recently Resolved

| Question | Decision | Date |
|----------|----------|------|
| File upload architecture | **Signed URLs** — 5MB max, JPEG/PNG/WebP, private bucket, 15-min read URLs, client-side resize to 1920px | 2026-03-25 |
| Session timeout | **7-day sliding window** — refresh daily on activity, re-auth after 7 days inactive | 2026-03-25 |
| Employee team change | **Points stay with employee** — points are user-scoped, not team-scoped; no data migration needed on team change | 2026-03-25 |
| Branch-specific rewards | **Yes (nullable branch_id)** — `rewards.branch_id` added, NULL = global reward available to all branches | 2026-03-25 |
| Redemption notes field | **Added** — `redemptions.notes` column for keterangan (e.g., size for kaos/seragam) | 2026-03-25 |
| Admin redemption access | **Yes** — Admin can request redemptions (full system access) | 2026-03-25 |
| RLS session variable safety | **SET LOCAL** — must use `SET LOCAL` within transactions to prevent variable leakage across pooled connections | 2026-03-25 |
| Production database tier | **db-f1-micro** — sufficient for ~100 users, lowest cost; upgrade if needed | 2026-03-25 |
| Point impact retroactivity | **Retroactive** — changing +10 to +15 affects all historical balances (simpler calculation via system_settings at query time) | 2026-03-24 |
| Reward catalog i18n | **No** — rewards data comes from Google Sheets; Thailand branch features not yet established | 2026-03-24 |
| Leader self-submission | **No** — leaders cannot give themselves points. Leader A can give Leader B. HR can give anyone. | 2026-03-24 |
| Multiple challengers | **Yes** — multiple people can challenge the same submission; HR resolves once for all | 2026-03-24 |
| Notification retention | **90 days** — auto-delete read notifications after 90 days | 2026-03-24 |
