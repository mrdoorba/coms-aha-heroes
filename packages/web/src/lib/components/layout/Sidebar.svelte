<script lang="ts">
  import { page } from '$app/stores'
  import {
    LayoutDashboard,
    Trophy,
    Star,
    Users,
    Gift,
    Bell,
    Settings,
    FileText,
    Shield,
    ChevronLeft,
    LogOut,
  } from 'lucide-svelte'
  import Icon from '$lib/components/Icon.svelte'
  import { userState } from '$lib/state/userState.svelte'
  import { uiState } from '$lib/state/uiState.svelte'
  import { signOut } from '$lib/auth/client'
  import { goto, invalidateAll } from '$app/navigation'
  import * as m from '$lib/paraglide/messages'

  const navItems = $derived([
    { href: '/dashboard', label: m.nav_dashboard(), icon: LayoutDashboard },
    { href: '/leaderboard', label: m.nav_leaderboard(), icon: Trophy },
    { href: '/points', label: m.nav_points(), icon: Star },
    { href: '/teams', label: m.nav_teams(), icon: Users },
    { href: '/rewards', label: m.nav_rewards(), icon: Gift },
    { href: '/notifications', label: m.nav_notifications(), icon: Bell },
  ])

  const adminItems = $derived([
    { href: '/admin/users', label: m.nav_users(), icon: Users },
    { href: '/admin/settings', label: m.nav_settings(), icon: Settings },
    { href: '/admin/audit-log', label: m.nav_audit_log(), icon: FileText },
  ])

  function isActive(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }

  async function handleSignOut() {
    await signOut()
    await invalidateAll()
    goto('/login')
  }
</script>

<aside
  class="hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 {uiState.sidebarCollapsed
    ? 'w-16'
    : 'w-64'}"
>
  <!-- Branding -->
  <div class="flex items-center gap-3 px-4 py-5 border-b border-border">
    <div class="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground shrink-0">
      <Icon icon={Shield} size={16} strokeWidth={2} />
    </div>
    {#if !uiState.sidebarCollapsed}
      <span class="font-bold text-sm tracking-wide text-foreground">{m.app_name()}</span>
    {/if}
    <button
      onclick={() => uiState.toggleSidebar()}
      class="ml-auto p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      aria-label={uiState.sidebarCollapsed ? m.sidebar_expand() : m.sidebar_collapse()}
    >
      <Icon
        icon={ChevronLeft}
        size={16}
        class="transition-transform duration-300 {uiState.sidebarCollapsed ? 'rotate-180' : ''}"
      />
    </button>
  </div>

  <!-- Main nav -->
  <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">
    {#each navItems as item}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
          {isActive(item.href)
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
        title={uiState.sidebarCollapsed ? item.label : undefined}
      >
        <Icon icon={item.icon} size={18} strokeWidth={1.5} class="shrink-0" />
        {#if !uiState.sidebarCollapsed}
          <span>{item.label}</span>
        {/if}
      </a>
    {/each}

    {#if userState.isAdmin}
      <div class="pt-4">
        {#if !uiState.sidebarCollapsed}
          <p class="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {m.nav_admin()}
          </p>
        {:else}
          <div class="border-t border-border my-2"></div>
        {/if}
        {#each adminItems as item}
          <a
            href={item.href}
            class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
              {isActive(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
            title={uiState.sidebarCollapsed ? item.label : undefined}
          >
            <Icon icon={item.icon} size={18} strokeWidth={1.5} class="shrink-0" />
            {#if !uiState.sidebarCollapsed}
              <span>{item.label}</span>
            {/if}
          </a>
        {/each}
      </div>
    {/if}
  </nav>

  <!-- Sign out -->
  <div class="border-t border-border p-2">
    <button
      onclick={handleSignOut}
      class="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      title={uiState.sidebarCollapsed ? m.common_logout() : undefined}
    >
      <Icon icon={LogOut} size={18} strokeWidth={1.5} class="shrink-0" />
      {#if !uiState.sidebarCollapsed}
        <span>{m.common_logout()}</span>
      {/if}
    </button>
  </div>
</aside>
