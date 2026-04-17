<script lang="ts">
  import { page } from '$app/stores'
  import {
    Trophy,
    Bell,
    User,
    Menu,
    X,
    Search,
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
  } from 'lucide-svelte'
  import { userState } from '$lib/state/userState.svelte'
  import * as m from '$lib/paraglide/messages'
  import type { AuthUser } from '@coms/shared/types'

  let {
    user,
    avatarUrl,
    unreadCount = 0,
    onOpenPalette,
  }: {
    user: AuthUser
    avatarUrl?: string | null
    unreadCount?: number
    onOpenPalette?: () => void
  } = $props()

  let menuOpen = $state(false)

  const isAdminOrHr = $derived(user.role === 'admin' || user.role === 'hr')

  const initials = $derived(
    user.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  )

  const adminNavItems = [
    { href: '/dashboard', label: () => m.nav_dashboard(), icon: LayoutDashboard },
    { href: '/points', label: () => m.nav_points(), icon: Award },
    { href: '/rewards', label: () => m.nav_rewards(), icon: Gift },
    { href: '/redemptions', label: () => m.nav_redemptions(), icon: ShoppingCart },
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

  function closeMenu() {
    menuOpen = false
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeMenu()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Mobile top bar — hidden on desktop -->
<header class="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-4 md:hidden
  bg-[#0d1229]/85 backdrop-blur-xl border-b border-white/10">

  <div class="flex items-center gap-2">
    <!-- Hamburger — admin/HR only -->
    {#if isAdminOrHr}
      <button
        type="button"
        onclick={() => (menuOpen = true)}
        class="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white transition-colors -ml-1"
        aria-label="Menu"
        aria-expanded={menuOpen}
      >
        <Menu class="h-5 w-5" />
      </button>
    {/if}

    <!-- Trophy gold logo -->
    <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
      <Trophy class="h-3.5 w-3.5 text-[#7a5800]" />
    </div>
    <span class="font-manrope text-[15px] font-extrabold tracking-wide text-white">
      AHA HEROES
    </span>
  </div>

  <div class="flex items-center gap-1">
    <!-- Search / Command palette (placeholder — real wiring in Phase 4) -->
    <button
      type="button"
      onclick={onOpenPalette}
      class="flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white transition-colors"
      aria-label="Search"
    >
      <Search class="h-5 w-5" />
    </button>

    <!-- Notifications -->
    <a
      href="/notifications"
      class="relative flex h-10 w-10 items-center justify-center rounded-full text-white/60 hover:bg-white/8 hover:text-white transition-colors"
      aria-label={m.nav_notifications()}
    >
      <Bell class="h-5 w-5" />
      {#if unreadCount > 0}
        <span class="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F4C144] text-[9px] font-bold leading-none text-[#7a5800]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      {/if}
    </a>

    <!-- Avatar link -->
    <a
      href="/profile"
      class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#325FEC]/30 text-xs font-bold text-[#759EEE] ring-1 ring-white/15 hover:ring-[#759EEE]/50 transition-all"
    >
      {#if avatarUrl}
        <img
          src={avatarUrl}
          alt={user.name}
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
    </a>
  </div>
</header>

<!-- Slide-over admin menu — admin/HR only, mobile only -->
{#if isAdminOrHr && menuOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
    onclick={closeMenu}
  ></div>

  <!-- Panel -->
  <div class="fixed inset-y-0 left-0 z-[70] w-72 bg-card shadow-2xl md:hidden animate-slide-in-left flex flex-col">
    <!-- Panel header -->
    <div class="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
      <div class="flex items-center gap-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-md">
          <Trophy class="h-3.5 w-3.5 text-[#7a5800]" />
        </div>
        <span class="font-manrope text-[15px] font-extrabold tracking-wide text-foreground">
          AHA HEROES
        </span>
      </div>
      <button
        type="button"
        onclick={closeMenu}
        class="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/8 hover:text-foreground transition-colors"
        aria-label="Close menu"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Panel nav -->
    <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
      {#each adminNavItems as item}
        {@const active = isActive(item.href)}
        <a
          href={item.href}
          onclick={closeMenu}
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-primary/8 hover:text-foreground
            {active ? 'sidebar-link-active' : ''}"
        >
          <svelte:component this={item.icon} class="h-[18px] w-[18px] shrink-0" />
          <span class="leading-none">{item.label()}</span>
        </a>
      {/each}
    </nav>

    <!-- Panel footer -->
    <div class="border-t border-border p-2 shrink-0">
      <div class="flex items-center gap-3 rounded-lg px-3 py-2.5">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/15">
          {#if avatarUrl}
            <img
              src={avatarUrl}
              alt={user.name}
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
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
            {user.role}
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}
