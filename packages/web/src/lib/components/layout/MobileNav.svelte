<script lang="ts">
  import { page } from '$app/stores'
  import { LayoutDashboard, Award, Trophy, Gift, User } from 'lucide-svelte'
  import * as m from '$lib/paraglide/messages'

  const navItems = [
    { href: '/dashboard', label: () => m.nav_dashboard(), icon: LayoutDashboard },
    { href: '/points', label: () => m.nav_points(), icon: Award },
    { href: '/leaderboard', label: () => m.nav_leaderboard(), icon: Trophy },
    { href: '/rewards', label: () => m.nav_rewards(), icon: Gift },
    { href: '/profile', label: () => m.nav_profile(), icon: User },
  ]

  function isActive(href: string) {
    return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
  }
</script>

<nav class="fixed bottom-0 left-0 right-0 z-50 flex items-stretch md:hidden
  bg-[#0d1229]/85 backdrop-blur-xl border-t border-white/10
  h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
  {#each navItems as item (item.href)}
    {@const active = isActive(item.href)}
    <a
      href={item.href}
      class="relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px] transition-colors duration-200
        {active ? 'text-[#F4C144] bnav-active' : 'text-white/40 hover:text-white/70'}"
    >
      <item.icon class="h-5 w-5 shrink-0" />
      <span class="text-[10px] font-semibold leading-none tracking-wide">{item.label()}</span>
    </a>
  {/each}
</nav>
