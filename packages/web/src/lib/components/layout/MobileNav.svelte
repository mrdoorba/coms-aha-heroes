<script lang="ts">
  import { page } from '$app/stores'
  import { LayoutDashboard, Trophy, Star, Gift, Bell } from 'lucide-svelte'
  import Icon from '$lib/components/Icon.svelte'

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/leaderboard', label: 'Board', icon: Trophy },
    { href: '/points', label: 'Points', icon: Star },
    { href: '/rewards', label: 'Rewards', icon: Gift },
    { href: '/notifications', label: 'Alerts', icon: Bell },
  ]

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
