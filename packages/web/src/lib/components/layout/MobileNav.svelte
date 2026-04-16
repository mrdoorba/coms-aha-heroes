<script lang="ts">
  import { page } from '$app/stores'
  import { LayoutDashboard, Trophy, Star, Gift, Bell } from 'lucide-svelte'
  import Icon from '$lib/components/Icon.svelte'
  import * as m from '$lib/paraglide/messages'

  const navItems = $derived([
    { href: '/dashboard', label: m.nav_dashboard(), icon: LayoutDashboard },
    { href: '/leaderboard', label: m.nav_leaderboard(), icon: Trophy },
    { href: '/points', label: m.nav_points(), icon: Star },
    { href: '/rewards', label: m.nav_rewards(), icon: Gift },
    { href: '/notifications', label: m.nav_notifications(), icon: Bell },
  ])

  function isActive(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 z-10 flex md:hidden border-t border-border bg-card">
  {#each navItems as item}
    <a
      href={item.href}
      class="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors
        {isActive(item.href)
        ? 'text-primary'
        : 'text-muted-foreground hover:text-foreground'}"
    >
      <Icon icon={item.icon} size={20} strokeWidth={1.5} />
      <span>{item.label}</span>
    </a>
  {/each}
</nav>
