<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as m from '$lib/paraglide/messages'
  import { ArrowLeft, User, Star, Award, AlertTriangle } from 'lucide-svelte'

  let { data } = $props()

  const { user } = $derived(data)

  const ROLE_BADGE: Record<string, string> = {
    admin: 'bg-gradient-to-br from-[#325FEC]/15 to-[#759EEE]/10 text-[#325FEC] border-[#325FEC]/25 dark:text-[#759EEE]',
    hr: 'bg-primary/8 text-primary border-primary/20',
    leader: 'bg-[#6D50B8]/10 text-[#6D50B8] border-[#6D50B8]/25 dark:text-[#9B7FE8]',
    employee: 'bg-muted text-muted-foreground border-border',
  }

  function roleBadgeClass(role: string) {
    return ROLE_BADGE[role] ?? ROLE_BADGE.employee
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
</script>

<div class="page-transition mx-auto max-w-6xl px-4 py-6 sm:px-6">
  <!-- Back + Header -->
  <div class="mb-6 flex items-center gap-3">
    <a
      href="/admin/users"
      class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-primary/8 hover:text-primary"
    >
      <ArrowLeft class="h-5 w-5" />
    </a>
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#325FEC] to-[#759EEE] shadow-[0_4px_12px_rgba(50,95,236,0.25)]"
      >
        <User class="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 class="text-xl font-extrabold text-foreground">{user.name}</h1>
        <p class="mt-0.5 text-[13px] font-medium text-muted-foreground">
          {user.teamName ?? '—'} · {user.department ?? '—'} · {user.position ?? '—'}
        </p>
      </div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="mb-6 grid grid-cols-3 gap-4">
    <div class="rounded-xl border border-border bg-card p-4 shadow-card">
      <div class="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
        <Star class="h-4 w-4 text-yellow-500" />
        {m.employee_detail_poin_bintang()}
      </div>
      <div class="mt-1 text-2xl font-extrabold text-foreground">—</div>
    </div>
    <div class="rounded-xl border border-border bg-card p-4 shadow-card">
      <div class="text-[13px] font-semibold text-muted-foreground">
        {m.employee_detail_poin_aha()}
      </div>
      <div class="mt-1 text-2xl font-extrabold text-primary">—</div>
    </div>
    <div class="rounded-xl border border-border bg-card p-4 shadow-card">
      <div class="text-[13px] font-semibold text-destructive/70">
        {m.employee_detail_penalti()}
      </div>
      <div class="mt-1 text-2xl font-extrabold text-destructive">—</div>
    </div>
  </div>

  <!-- User detail card -->
  <div class="rounded-xl border border-border bg-card shadow-card">
    <div class="border-b border-border bg-muted/40 px-5 py-3">
      <h2 class="text-sm font-bold text-foreground">{m.common_edit()} {m.nav_users()}</h2>
    </div>
    <div class="p-5">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p class="text-xs text-muted-foreground">{m.users_col_role()}</p>
          <Badge variant="outline" class="mt-1 {roleBadgeClass(user.role)}">{user.role}</Badge>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{m.users_col_status()}</p>
          <span
            class="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold {user.isActive
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}"
          >
            {user.isActive ? m.status_active() : m.status_archived()}
          </span>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">{m.employee_detail_col_date()}</p>
          <p class="mt-1 text-sm font-medium">{formatDate(user.createdAt)}</p>
        </div>
        {#if user.teamName}
          <div>
            <p class="text-xs text-muted-foreground">{m.users_col_team()}</p>
            <p class="mt-1 text-sm font-medium">{user.teamName}</p>
          </div>
        {/if}
        {#if user.department}
          <div>
            <p class="text-xs text-muted-foreground">{m.users_col_department()}</p>
            <p class="mt-1 text-sm font-medium">{user.department}</p>
          </div>
        {/if}
        {#if user.position}
          <div>
            <p class="text-xs text-muted-foreground">{m.profile_position()}</p>
            <p class="mt-1 text-sm font-medium">{user.position}</p>
          </div>
        {/if}
        {#if user.branchId}
          <div>
            <p class="text-xs text-muted-foreground">{m.profile_branch()}</p>
            <p class="mt-1 text-sm font-medium">{user.branchId}</p>
          </div>
        {/if}
      </div>

      <div class="mt-6 border-t border-border pt-5">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label for="edit-name" class="text-sm font-semibold text-foreground">
              {m.users_col_name()}
            </label>
            <input
              id="edit-name"
              type="text"
              value={user.name}
              class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled
            />
          </div>
          <div class="space-y-1.5">
            <label for="edit-email" class="text-sm font-semibold text-foreground">
              {m.login_email()}
            </label>
            <input
              id="edit-email"
              type="email"
              value={user.email}
              class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled
            />
          </div>
          <div class="space-y-1.5">
            <label for="edit-role" class="text-sm font-semibold text-foreground">
              {m.users_col_role()}
            </label>
            <select
              id="edit-role"
              class="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled
            >
              <option value={user.role}>{user.role}</option>
            </select>
          </div>
        </div>
        <p class="mt-4 text-xs text-muted-foreground">
          Full edit functionality coming in Phase 10.
        </p>
      </div>
    </div>
  </div>
</div>
