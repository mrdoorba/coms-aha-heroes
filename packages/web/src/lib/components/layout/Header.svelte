<script lang="ts">
  import { User, ChevronDown, Search, LogOut } from 'lucide-svelte'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { userState } from '$lib/state/userState.svelte'
  import { signOut } from '$lib/auth/client'
  import { goto, invalidateAll } from '$app/navigation'
  import * as m from '$lib/paraglide/messages'
  import ThemeToggle from '$lib/components/ThemeToggle.svelte'
  import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte'
  import NotificationsBadge from '$lib/components/NotificationsBadge.svelte'

  let {
    avatarUrl,
    unreadCount = 0,
    onOpenPalette,
  }: {
    avatarUrl?: string | null
    unreadCount?: number
    onOpenPalette?: () => void
  } = $props()

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

  async function handleSignOut() {
    await signOut()
    await invalidateAll()
    goto('/login')
  }
</script>

<header class="sticky top-0 z-30 hidden md:flex h-14 items-center justify-between px-6
  bg-card/80 border-border border-b backdrop-blur-md
  shadow-[0_1px_0_0_rgba(29,56,139,0.06)] dark:shadow-none">

  <!-- Command palette trigger -->
  <button
    type="button"
    onclick={onOpenPalette}
    class="border-border bg-muted flex w-full max-w-xs items-center gap-2.5 rounded-xl border
      text-muted-foreground/70 h-9 px-3 text-sm transition-all
      hover:border-primary/25 hover:bg-card hover:text-muted-foreground
      cursor-pointer select-none"
    aria-label="Open command palette"
  >
    <Search class="text-muted-foreground/60 h-3.5 w-3.5 shrink-0" />
    <span class="flex-1 text-left">{m.header_search_placeholder()}</span>
    <kbd class="border-border bg-card/70 text-primary/50 flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold shadow-sm">
      <span class="text-[11px]">⌘</span>K
    </kbd>
  </button>

  <div class="flex items-center gap-2">
    <LanguageSwitcher />
    <ThemeToggle />
    <NotificationsBadge {unreadCount} />

    <!-- User dropdown -->
    <DropdownMenu>
      <DropdownMenuTrigger class="hover:bg-primary/6 flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors">
        <div class="bg-primary/15 text-primary ring-primary/20 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-1">
          {#if avatarUrl}
            <img
              src={avatarUrl}
              alt={userState.current?.name ?? ''}
              class="h-full w-full object-cover"
              width={28}
              height={28}
              loading="lazy"
              decoding="async"
            />
          {:else if initials}
            <span>{initials}</span>
          {:else}
            <User class="h-3.5 w-3.5" />
          {/if}
        </div>
        <span class="text-foreground max-w-[120px] truncate text-sm font-semibold">
          {userState.current?.name ?? ''}
        </span>
        <ChevronDown class="text-muted-foreground h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuItem class="flex items-center gap-2">
          <a href="/profile" class="flex items-center gap-2 w-full">
            <User class="h-4 w-4" />
            {m.nav_profile()}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
          onclick={handleSignOut}
        >
          <LogOut class="h-4 w-4" />
          {m.common_logout()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>
