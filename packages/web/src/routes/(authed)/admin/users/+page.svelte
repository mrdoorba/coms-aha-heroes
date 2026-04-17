<script lang="ts">
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as Table from '$lib/components/ui/table'
  import * as m from '$lib/paraglide/messages'
  import { Search, Plus, User, Pencil, Archive, ChevronLeft, ChevronRight } from 'lucide-svelte'

  let { data } = $props()

  type UserRow = {
    id: string
    name: string
    email: string
    role: string
    teamName: string | null
    isActive: boolean
  }

  let users = $state<UserRow[]>(data.users as UserRow[])
  let meta = $state(data.meta ?? { total: 0, page: 1, limit: 100 })
  let search = $state('')
  let roleFilter = $state('')
  let activeFilter = $state('')
  let page = $state(1)
  let isLoading = $state(false)

  const totalPages = $derived(Math.ceil(meta.total / (meta.limit ?? 100)))

  const ROLE_BADGE: Record<string, string> = {
    admin:
      'bg-gradient-to-br from-[#325FEC]/15 to-[#759EEE]/10 text-[#325FEC] border-[#325FEC]/25 dark:text-[#759EEE]',
    hr: 'bg-primary/8 text-primary border-primary/20',
    leader: 'bg-[#6D50B8]/10 text-[#6D50B8] border-[#6D50B8]/25 dark:text-[#9B7FE8]',
    employee: 'bg-muted text-muted-foreground border-border',
  }

  function roleBadgeClass(role: string) {
    return ROLE_BADGE[role] ?? ROLE_BADGE.employee
  }

  async function fetchUsers(params?: {
    search?: string
    role?: string
    isActive?: string
    page?: number
  }) {
    isLoading = true
    const s = params?.search ?? search
    const r = params?.role ?? roleFilter
    const a = params?.isActive ?? activeFilter
    const p = params?.page ?? page
    try {
      const q = new URLSearchParams({ limit: '20', page: String(p) })
      if (s) q.set('search', s)
      if (r) q.set('role', r)
      if (a !== '') q.set('isActive', a)
      const res = await fetch(`/api/v1/users?${q.toString()}`, { credentials: 'include' })
      const json = await res.json()
      users = (json.data ?? []) as UserRow[]
      meta = json.meta ?? { total: 0, page: p, limit: 20 }
    } finally {
      isLoading = false
    }
  }

  function handleSearch(e: Event) {
    search = (e.target as HTMLInputElement).value
    page = 1
    fetchUsers({ search, page: 1 })
  }

  function handleRoleFilter(e: Event) {
    roleFilter = (e.target as HTMLSelectElement).value === 'all' ? '' : (e.target as HTMLSelectElement).value
    page = 1
    fetchUsers({ role: roleFilter, page: 1 })
  }

  function handleActiveFilter(e: Event) {
    activeFilter = (e.target as HTMLSelectElement).value === 'all' ? '' : (e.target as HTMLSelectElement).value
    page = 1
    fetchUsers({ isActive: activeFilter, page: 1 })
  }
</script>

<div class="page-transition mx-auto max-w-6xl px-4 py-6 sm:px-6">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#325FEC] to-[#759EEE] shadow-[0_4px_12px_rgba(50,95,236,0.25)]"
      >
        <User class="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 class="text-xl font-extrabold text-foreground">{m.nav_users()}</h1>
        <p class="mt-0.5 text-[13px] font-medium text-muted-foreground">
          {m.users_total({ count: String(meta.total) })}
        </p>
      </div>
    </div>
    <Button
      href="/admin/users/new"
      class="h-9 shrink-0 rounded-xl px-4 font-semibold shadow-[0_2px_8px_rgba(50,95,236,0.25)] bg-gradient-to-br from-[#325FEC] to-[#759EEE] text-white"
    >
      <Plus class="h-4 w-4" />
      {m.users_add()}
    </Button>
  </div>

  <!-- Filters -->
  <div
    class="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card sm:flex-row sm:items-center"
  >
    <div class="relative flex-1">
      <Search class="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={m.users_search_placeholder()}
        value={search}
        oninput={handleSearch}
        class="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
    <select
      value={roleFilter || 'all'}
      onchange={handleRoleFilter}
      class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-36"
    >
      <option value="all">{m.users_all_roles()}</option>
      <option value="admin">Admin</option>
      <option value="hr">HR</option>
      <option value="leader">Leader</option>
      <option value="employee">Employee</option>
    </select>
    <select
      value={activeFilter || 'all'}
      onchange={handleActiveFilter}
      class="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-36"
    >
      <option value="all">{m.users_all_status()}</option>
      <option value="true">{m.status_active()}</option>
      <option value="false">{m.status_archived()}</option>
    </select>
  </div>

  <!-- Table -->
  <div class="overflow-hidden rounded-xl border border-border bg-card shadow-card">
    <Table.Root>
      <Table.Header>
        <Table.Row class="border-b border-border bg-muted/60">
          <Table.Head class="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
            {m.users_col_name()}
          </Table.Head>
          <Table.Head class="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
            {m.users_col_role()}
          </Table.Head>
          <Table.Head class="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
            {m.users_col_team()}
          </Table.Head>
          <Table.Head class="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
            {m.users_col_status()}
          </Table.Head>
          <Table.Head class="w-24"></Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if isLoading}
          {#each [0, 1, 2, 3, 4] as _i}
            <Table.Row class="border-b border-border/50">
              <Table.Cell>
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8 animate-pulse rounded-full bg-primary/8"></div>
                  <div class="space-y-1.5">
                    <div class="h-3.5 w-32 animate-pulse rounded bg-primary/8"></div>
                    <div class="h-3 w-24 animate-pulse rounded bg-primary/5"></div>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell><div class="h-5 w-16 animate-pulse rounded-full bg-primary/8"></div></Table.Cell>
              <Table.Cell><div class="h-3.5 w-20 animate-pulse rounded bg-primary/5"></div></Table.Cell>
              <Table.Cell><div class="h-5 w-14 animate-pulse rounded-full bg-primary/8"></div></Table.Cell>
              <Table.Cell><div class="h-6 w-12 animate-pulse rounded bg-primary/5"></div></Table.Cell>
            </Table.Row>
          {/each}
        {:else}
          {#each users as user (user.id)}
            <Table.Row class="border-b border-border/50 transition-colors hover:bg-muted/40">
              <Table.Cell>
                <a href="/admin/users/{user.id}" class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <User class="h-4 w-4" />
                  </div>
                  <div>
                    <p class="font-semibold text-foreground transition-colors hover:text-primary">
                      {user.name}
                    </p>
                    <p class="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </a>
              </Table.Cell>
              <Table.Cell>
                <Badge variant="outline" class="text-xs font-semibold {roleBadgeClass(user.role)}">
                  {user.role}
                </Badge>
              </Table.Cell>
              <Table.Cell class="text-sm text-muted-foreground">{user.teamName ?? '—'}</Table.Cell>
              <Table.Cell>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold {user.isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}"
                >
                  {user.isActive ? m.status_active() : m.status_archived()}
                </span>
              </Table.Cell>
              <Table.Cell>
                <div class="flex items-center gap-1">
                  <a
                    href="/admin/users/{user.id}"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                    aria-label={m.common_edit()}
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </a>
                  {#if user.isActive}
                    <button
                      type="button"
                      class="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/8 hover:text-destructive"
                      aria-label={m.status_archived()}
                    >
                      <Archive class="h-3.5 w-3.5" />
                    </button>
                  {/if}
                </div>
              </Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={5} class="py-16">
                <div class="flex flex-col items-center gap-3 text-center">
                  <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8">
                    <User class="h-6 w-6 text-primary/50" />
                  </div>
                  <p class="text-sm font-medium text-muted-foreground">{m.users_empty()}</p>
                </div>
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>

    {#if totalPages > 1}
      <div
        class="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3"
      >
        <p class="text-[13px] font-medium text-muted-foreground">
          {m.common_page_of({ page: String(page), total: String(totalPages) })}
        </p>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onclick={() => { page -= 1; fetchUsers({ page }) }}
            class="h-8 w-8 border-border p-0 text-primary hover:bg-primary/8 disabled:opacity-40"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onclick={() => { page += 1; fetchUsers({ page }) }}
            class="h-8 w-8 border-border p-0 text-primary hover:bg-primary/8 disabled:opacity-40"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    {/if}
  </div>
</div>
