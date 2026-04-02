# AHA HEROES - Google Stitch Design Prompt

> **Purpose:** Complete prompt for AI Agent (Google Stitch) to generate all screens
> **Last Updated:** 2026-03-25

---

Create a complete mobile-first PWA web application called "AHA HEROES" — an internal HR achievement points tracking system. Design ALL screens listed below as a cohesive, professional application.

## Design System

**Font:** Manrope (Google Fonts) — all weights from 400 to 800
**Border radius:** 12px for cards, 8px for buttons/inputs, 20px for modals

**Color Palette:**

- Primary Dark: #1D388B (navbar, headers, primary text on light bg)
- Primary: #325FEC (buttons, links, active states, primary actions)
- Primary Light: #96ADF5 (hover states, secondary badges, light accents)
- Deep Navy: #0F0E7F (footer, dark sections, alternative headers)
- White: #FFFFFF (backgrounds, card surfaces, text on dark)
- Gold/Yellow: #F4C144 (star/Bintang icons, warnings, highlight badges, achievements)
- Purple: #6D50B8 (penalty badges, secondary actions, graphs accent)
- Sky Blue: #759EEE (info badges, progress bars, chart fills, tertiary accent)

**Status Colors:**

- Active/Approved: #22C55E (green)
- Pending: #F4C144 (gold)
- Challenged/Frozen: #6D50B8 (purple)
- Rejected/Revoked: #EF4444 (red)

**Shadows:** Use soft shadows: `0 2px 8px rgba(29, 56, 139, 0.08)` for cards, `0 4px 16px rgba(29, 56, 139, 0.12)` for modals

**Icons:** Use Lucide icons (SVG). NEVER use emojis as UI icons.

## Global Layout

**Mobile (< 768px):**

- Top bar: logo left, notification bell (with unread count badge) + user avatar right
- Bottom navigation bar (fixed): 4 tabs — Dashboard (LayoutDashboard icon), Points (Award icon), Leaderboard (Trophy icon), Profile (User icon)
- Content area scrolls between top bar and bottom nav
- All touch targets minimum 44x44px

**Desktop (>= 768px):**

- Left sidebar: logo at top, navigation links with icons, user info at bottom
- Top header bar: breadcrumbs, search, notification bell, language switcher (ID/EN/TH), user dropdown
- Main content area with max-width 1280px

**PWA:** Include install banner at top on first visit: "Add AHA HEROES to your home screen" with install button

## SCREENS TO CREATE

### 1. Login Page (/login)

- Centered card on gradient background (#1D388B to #0F0E7F)
- AHA HEROES logo at top (use a star/shield icon placeholder with "AHA HEROES" text in Manrope 800)
- Email input field
- Password input field with show/hide toggle
- "Login" button (#325FEC, full width)
- "Forgot password?" link below
- Language selector at bottom (ID | EN | TH)
- No "Register" option — accounts are created by HR/Admin only

### 2. Force Change Password (/change-password)

- Simple centered card
- Message: "Please set your new password to continue"
- New password field with strength indicator
- Confirm password field
- "Set Password" button (#325FEC)

### 3. Forgot Password (/forgot-password)

- Centered card
- Email input
- "Send Reset Link" button
- "Back to Login" link

### 4. Dashboard (/dashboard)

- **Summary cards row (4 cards):**
  - Bintang sAHAbat count (gold star icon #F4C144, large number)
  - Poin AHA balance (blue icon #325FEC, large number)
  - Penalti count (purple icon #6D50B8, large number) — only visible to the user themselves, leaders, HR, admin
  - Pending Actions count (gold icon #F4C144) — items needing approval/review
- **Recent Activity feed:** List of recent point submissions, challenges, approvals with timestamps, user avatars, and status badges
- **Quick Actions:** Floating action button (FAB) on mobile or action buttons on desktop:
  - "Give Bintang" (gold)
  - "Give Poin AHA" (blue)
  - "Give Penalti" (purple) — only for Leader/HR/Admin
  - "Redeem Points" (green)
- **Mini Leaderboard:** Top 5 employees by Poin AHA with rank, avatar, name, score
- For HR/Admin: additional card showing "Pending Approvals" count with link

### 5. Points List (/points)

- **Tab bar at top:** All | Bintang | Penalti | Poin AHA | Redemptions
- **Filter bar:** Status dropdown (All/Active/Pending/Challenged/Frozen/Revoked), Date range, Team filter (for leaders)
- **Point cards list:** Each card shows:
  - Left: category icon (star for Bintang in gold, warning triangle for Penalti in purple, award for Poin AHA in blue)
  - Center: employee name + avatar, reason text (truncated), date
  - Right: points value (+1, -3, +5 etc.), status badge (colored pill)
  - Tap to expand/navigate to detail
- **FAB button:** "+ Submit Points" (opens submission type selector)
- Empty state: illustration with "No points recorded yet"

### 6. Submit Bintang Form (/points/new/bintang)

- **Header:** "Give Bintang sAHAbat" with gold star icon
- **Form fields:**
  - Employee selector (searchable dropdown with avatars) — label: "Nama Staff"
  - Reason textarea — label: "Perbuatan" — placeholder: "[siapa] berkontribusi dalam [apa]"
  - Related staff input (tag-style multi-input) — label: "Related Staff" — optional
  - Screenshot upload (required) — drag & drop zone with camera icon, shows preview after upload
- **Submit button:** "Submit Bintang" (#F4C144 background, dark text)
- Note at bottom for employee self-submit: "Your submission will be pending Leader approval"

### 7. Submit Penalti Form (/points/new/penalti)

- **Header:** "Record Penalti" with purple warning icon
- **Form fields:**
  - Employee selector — "Nama Staff"
  - KITTA Category selector (radio buttons with descriptions):
    - K — Kualitas Hasil (Quality of work)
    - I — Inisiatif (Initiative)
    - T1 — Taat Aturan (Rule compliance)
    - T2 — Teamwork (Collaboration)
    - A — Kualitas Absensi (Attendance)
  - Violation level slider or stepper (1-10) with description labels:
    - 1: "Tidak sesuai SOP"
    - 2: "Berdampak terhadap member lain"
    - 3: "Berdampak terhadap pihak luar"
    - 4-5: "Menimbulkan kerugian finansial"
    - 6-10: "Pelanggaran berat"
  - Reason textarea — "Kejadian" — placeholder: "[siapa] [apa] sehingga [dampak]"
  - Related staff input — optional
  - Screenshot upload (required)
- **Submit button:** "Submit Penalti" (#6D50B8 background, white text)

### 8. Submit Poin AHA Form (/points/new/poin-aha)

- **Header:** "Give Poin AHA" with blue award icon
- **Form fields:**
  - Employee selector — "Nama Staff"
  - Activity textarea — "Kegiatan" — placeholder: "[siapa] berpartisipasi dalam [apa]"
  - Level selector (1-10) — stepper or slider with "= X Poin AHA" preview
  - Related staff input — optional
  - Screenshot upload (optional)
- **Submit button:** "Submit Poin AHA" (#325FEC background, white text)

### 9. Point Detail Page (/points/:id)

- **Top section:** Full point information card
  - Category badge (Bintang/Penalti/Poin AHA), status badge
  - Employee name + avatar (recipient)
  - Submitted by: name + role badge + date
  - Reason text (full)
  - Related staff listed
  - Screenshot image (expandable)
  - Points value prominently displayed
  - For Penalti: KITTA category + violation level shown
- **Action buttons (contextual by role):**
  - Leader: "Approve" / "Reject" (for pending self-submissions from own team)
  - HR/Admin: "Approve" / "Reject" / "Revoke" (with reason modal)
  - Leader: "Challenge" button (Penalti only — hidden for Bintang and Poin AHA, hidden for non-Leaders)
  - Penalized employee: "Appeal" button (Penalti only)
- **Challenges section:** List of filed challenges with status
- **Appeals section:** (Penalti only) Appeal status with resolution
- **Comment thread:** Messages with user avatars, names, timestamps, and reply input at bottom

### 10. Challenge Modal

- Triggered from Point Detail "Challenge" button
- **Form:** Reason textarea (required)
- **Submit button:** "File Challenge"
- Shows info: "This challenge will be reviewed by HR"

### 11. Appeal Modal (Penalti only)

- Triggered from Point Detail "Appeal" button
- **Info banner:** "Your penalty points will be frozen until HR resolves this appeal"
- **Form:** Reason textarea (required)
- **Submit button:** "Submit Appeal"

### 12. Resolve Challenge/Appeal Modal (HR only)

- **Decision:** Radio — "Upheld" or "Overturned"
- **Resolution note:** Textarea (required)
- **Submit button:** "Resolve"

### 13. Leaderboard (/leaderboard)

- **Toggle tabs:** "Bintang sAHAbat" | "Poin AHA"
- **Filter:** Team dropdown (optional)
- **Leaderboard list:**
  - Top 3 shown as podium (1st center/tallest, 2nd left, 3rd right) with large avatars and crown/medal icons
  - Remaining as numbered list: rank, avatar, name, department/team, score
  - Current user highlighted with "You" badge
  - Alternating row backgrounds for readability
- Penalti is NEVER shown on leaderboard
- Gold (#F4C144) accents for Bintang tab, Blue (#325FEC) for Poin AHA tab

### 14. Rewards Catalog (/rewards)

- **Grid of reward cards (2 columns mobile, 3-4 desktop):**
  - Reward image (placeholder if none)
  - Reward name
  - Point cost badge (e.g., "50 Poin AHA")
  - "Redeem" button
- **My balance** shown at top: "Your Poin AHA: XX" in a highlighted bar
- For HR/Admin: "+ Add Reward" button, edit/delete options on each card

### 15. Redeem Points Form (/rewards/:id/redeem)

- Shows selected reward with image and cost
- Current balance shown
- **Form fields:**
  - Staff name (pre-filled for self, selector for others)
  - Notes/Keterangan textarea (optional) — e.g., "Size: XL for kaos AHA"
- Balance check: if insufficient, show warning and disable submit
- **Submit button:** "Request Redemption"

### 16. Redemptions List (/redemptions)

- **Tabs:** My Requests | Pending Approval (HR/Admin only)
- **Cards:** Reward name, image thumbnail, points spent, status badge, date, approver name (if resolved)
- HR view: "Approve" / "Reject" action buttons on pending items

### 17. Notifications (/notifications)

- **Header:** "Notifications" with "Mark all as read" link
- **List:** Each notification:
  - Icon based on type (bell for general, star for Bintang, etc.)
  - Title + body text
  - Timestamp (relative: "2h ago", "Yesterday")
  - Unread indicator (blue dot on left)
  - Tap navigates to related entity
- Empty state: "No notifications yet"

### 18. User Profile (/profile)

- **Profile card:** Avatar (large, with edit camera icon), name, email, role badge, department, team, branch
- **Stats:** Bintang count, Poin AHA balance, Penalti count (own view only)
- **Actions:** Change Password, Language Preference (ID/EN/TH dropdown), Logout
- **Recent points** mini-list (last 5)

### 19. User Management (/users) — HR/Admin only

- **Data table (TanStack Table style):**
  - Columns: Avatar, Name, Email, Role (colored badge), Team, Department, Status (Active/Archived), Actions
  - Sortable columns, search bar, filters (role, team, status)
  - Pagination
- **"+ Create User" button** opens form:
  - Name, Email, Role selector, Branch selector (admin only), Team selector, Department, Position
  - "Create" generates account with temp password
- **Row actions:** Edit, Archive (with confirmation modal)

### 20. Team Management (/teams) — HR/Admin only

- **Cards or table:** Team name, leader avatar + name, member count
- **"+ Create Team" button**
- **Edit:** Name, assign leader (user selector)
- **View team:** Member list with roles

### 21. Admin Settings (/settings) — Admin only

- **Sections:**
  - Point Impact Values:
    - Bintang impact on Poin AHA: number input (default: +10)
    - Penalti impact on Poin AHA: number input (default: -5)
    - Warning: "Changing these values retroactively affects all historical balances"
  - Branch Management: List branches (Indonesia, Thailand) with timezone and locale
  - Point Categories: List the 3 categories with active/inactive toggle
- **Save button** per section

### 22. Audit Log (/admin/audit-log) — Admin/HR only

- **Data table:**
  - Columns: Timestamp, Actor (name + role), Action (colored badge), Entity Type, Entity ID (link), Details
  - Filters: Date range, Actor, Action type, Entity type
  - Pagination
- Export button (future)

### 23. Reports Dashboard (/reports) — Admin/HR only

- **Summary cards:** Total submissions this month, by category breakdown (pie chart), by team (bar chart)
- **Charts:**
  - Submissions over time (line chart, #325FEC line, #96ADF5 fill)
  - Points by category (donut chart: gold for Bintang, purple for Penalti, blue for Poin AHA)
  - Top teams by Poin AHA (horizontal bar chart)
- Filter: Branch, date range

### 24. 404 Not Found Page

- Centered illustration
- "Page not found" heading
- "Back to Dashboard" button

### 25. Offline Indicator

- When offline: show a top banner in #F4C144 (gold) with text "You're offline — some features may be unavailable"

## Key Interaction Patterns

- All forms: inline validation, error messages below fields in red
- Loading states: skeleton screens for lists/cards, spinner for buttons
- Modals: dark overlay, centered, close on X or click outside
- Toast notifications: bottom-right on desktop, top on mobile, auto-dismiss 5s
- Pull-to-refresh on mobile lists
- Smooth page transitions (fade)
- All clickable cards have cursor-pointer and hover:shadow-lg transition
- Status badges use colored pills with matching text: Active (green), Pending (gold), Challenged (purple), Frozen (purple/outlined), Revoked (red), Rejected (red/outlined)

## Typography Scale

- H1: Manrope 800, 28px mobile / 36px desktop
- H2: Manrope 700, 22px mobile / 28px desktop
- H3: Manrope 600, 18px mobile / 22px desktop
- Body: Manrope 400, 16px
- Small/Caption: Manrope 400, 13px
- Button: Manrope 600, 15px
- Badge: Manrope 600, 12px

## Tech Context

Built with TanStack Start v1, TanStack Router, TypeScript, Tailwind CSS 4 (via @tailwindcss/vite), and shadcn/ui components. Elysia embedded for API routes. Paraglide JS for i18n (ID/EN/TH). Design with Tailwind utility classes in mind. Mobile-first responsive. PWA installable (manual manifest + Workbox).

### Implementation Status

| Screen | Status | Notes |
|--------|--------|-------|
| Login | Done | Multi-language, email/password + Google OAuth |
| Force Change Password | Not started | |
| Forgot Password | Not started | No email provider configured yet |
| Dashboard | Done | Summary cards, recent activity, quick actions, mini leaderboard |
| Points List | Done | Tabbed by category, filterable by status |
| Submit Bintang | Done | |
| Submit Penalti | Done | KITTA categories, violation levels |
| Submit Poin AHA | Done | |
| Point Detail | Done | Actions contextual by role |
| Challenge Modal | Done | |
| Appeal Modal | Done | |
| Resolve Modal | Done | |
| Leaderboard | Done | Bintang + Poin AHA tabs, team filter |
| Rewards Catalog | Done | HR/Admin CRUD |
| Redeem Points | Done | Balance check |
| Redemptions List | Done | Tabs: My Requests / Pending Approval |
| Notifications | Not started | |
| User Profile | Not started | |
| User Management | Done | Data table with search, filters, bulk actions |
| Team Management | Done | |
| Admin Settings | Done | Point impact values |
| Audit Log | Done | Filterable data table |
| Reports Dashboard | Done | Summary cards, by-category bars, by-team bars, submissions over time chart (no Recharts — custom bar charts) |
| 404 Page | Not started | |
| Offline Indicator | Not started | |
