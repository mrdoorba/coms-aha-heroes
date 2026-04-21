<script lang="ts">
  import { page } from '$app/stores'
  import {
    Trophy,
    LayoutDashboard,
    Award,
    Gift,
    ShoppingCart,
    Users,
    Building2,
    BarChart3,
    FileText,
    RefreshCw,
    Settings,
    User,
  } from 'lucide-svelte'
  import { userState } from '$lib/state/userState.svelte'
  import { uiState } from '$lib/state/uiState.svelte'
  import * as m from '$lib/paraglide/messages'

  let { avatarUrl }: { avatarUrl?: string | null } = $props()

  const mainNavItems = [
    { href: '/dashboard', label: () => m.nav_dashboard(), icon: LayoutDashboard },
    { href: '/points', label: () => m.nav_points(), icon: Award },
    { href: '/leaderboard', label: () => m.nav_leaderboard(), icon: Trophy },
    { href: '/rewards', label: () => m.nav_rewards(), icon: Gift },
    { href: '/redemptions', label: () => m.nav_redemptions(), icon: ShoppingCart },
  ]

  const adminNavItems = [
    { href: '/users', label: () => m.nav_users(), icon: Users },
    { href: '/teams', label: () => m.nav_teams(), icon: Building2 },
    { href: '/reports', label: () => m.nav_reports(), icon: BarChart3 },
    { href: '/admin/audit-log', label: () => m.nav_audit_log(), icon: FileText },
    { href: '/admin/sheet-sync', label: () => m.nav_sheet_sync(), icon: RefreshCw },
    { href: '/settings', label: () => m.nav_settings(), icon: Settings },
  ]

  function isActive(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }

  const initials = $derived(
    userState.current?.name
      ? userState.current.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : '',
  )

  const isAdminOrHr = $derived(
    userState.isAdmin || userState.current?.role === 'hr',
  )
</script>

<aside
  class="fixed top-9 left-0 z-40 hidden md:flex h-[calc(100vh-2.25rem)] flex-col transition-[width] duration-200 bg-card border-r border-border
    {uiState.sidebarCollapsed ? 'w-16' : 'w-64'}"
  onmouseenter={() => uiState.setSidebarCollapsed(false)}
  onmouseleave={() => uiState.setSidebarCollapsed(true)}
  role="navigation"
>
  <!-- Logo -->
  <div class="flex h-16 items-center border-b border-border {uiState.sidebarCollapsed ? 'justify-center px-0' : 'px-4'}">
    <div class="flex items-center gap-2">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
        <Trophy class="h-4 w-4 text-[#7a5800]" />
      </div>
      {#if !uiState.sidebarCollapsed}
        <span class="font-manrope text-[15px] font-extrabold tracking-wide text-foreground">
          AHA HEROES
        </span>
      {/if}
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
    {#each mainNavItems as item (item.href)}
      {@const active = isActive(item.href)}
      <a
        href={item.href}
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-foreground
          {uiState.sidebarCollapsed ? 'justify-center px-0' : ''}
          {active ? 'sidebar-link-active' : ''}"
        title={uiState.sidebarCollapsed ? item.label() : undefined}
      >
        <item.icon class="h-[18px] w-[18px] shrink-0" />
        {#if !uiState.sidebarCollapsed}
          <span class="leading-none">{item.label()}</span>
        {/if}
      </a>
    {/each}

    {#if isAdminOrHr}
      <div class="pt-4 pb-1.5 {uiState.sidebarCollapsed ? 'px-1' : 'px-3'}">
        {#if !uiState.sidebarCollapsed}
          <span class="section-label text-muted-foreground/50">{m.nav_admin()}</span>
        {:else}
          <div class="border-t border-border"></div>
        {/if}
      </div>
      {#each adminNavItems as item (item.href)}
        {@const active = isActive(item.href)}
        <a
          href={item.href}
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-foreground
            {uiState.sidebarCollapsed ? 'justify-center px-0' : ''}
            {active ? 'sidebar-link-active' : ''}"
          title={uiState.sidebarCollapsed ? item.label() : undefined}
        >
          <item.icon class="h-[18px] w-[18px] shrink-0" />
          {#if !uiState.sidebarCollapsed}
            <span class="leading-none">{item.label()}</span>
          {/if}
        </a>
      {/each}
    {/if}
  </nav>

  <!-- User footer -->
  <div class="border-t border-border p-2">
    <div class="flex items-center gap-3 rounded-lg px-3 py-2.5 {uiState.sidebarCollapsed ? 'justify-center px-0' : ''}">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
        {#if avatarUrl}
          <img
            src={avatarUrl}
            alt={userState.current?.name ?? ''}
            class="h-full w-full object-cover"
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
          />
        {:else if initials}
          <span>{initials}</span>
        {:else}
          <User class="h-4 w-4" />
        {/if}
      </div>
      {#if !uiState.sidebarCollapsed}
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-foreground">{userState.current?.name ?? ''}</p>
          <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            {userState.current?.role ?? ''}
          </span>
        </div>
      {/if}
    </div>
  </div>
</aside>
