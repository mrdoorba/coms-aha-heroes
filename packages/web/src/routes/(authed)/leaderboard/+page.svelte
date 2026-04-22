<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { Trophy, Star, AlertTriangle } from 'lucide-svelte'
  import Podium from '$lib/components/leaderboard/Podium.svelte'
  import LeaderboardRow from '$lib/components/leaderboard/LeaderboardRow.svelte'
  import * as m from '$lib/paraglide/messages'
  import { buildSearchParams } from '$lib/utils'

  let { data } = $props()

  const currentUserId = $derived(data.user?.id ?? '')

  const TYPE_OPTIONS = $derived([
    { value: 'bintang' as const, label: m.points_bintang(), icon: Star, color: '#F4C144' },
    { value: 'poin_aha' as const, label: m.points_poin_aha(), icon: Trophy, color: '#325FEC' },
    { value: 'penalti' as const, label: m.leaderboard_penalty(), icon: AlertTriangle, color: '#EF4444' },
  ])

  const PERIOD_OPTIONS = $derived([
    { value: '1', label: m.leaderboard_last_month() },
    { value: '2', label: m.leaderboard_last_months({ count: 2 }) },
    { value: '3', label: m.leaderboard_last_months({ count: 3 }) },
    { value: '6', label: m.leaderboard_last_months({ count: 6 }) },
    { value: '12', label: m.leaderboard_last_months({ count: 12 }) },
  ])

  type LeaderboardEntry = {
    rank: number
    name: string
    avatarUrl: string | null
    score: number
    userId: string
  }

  const entries = $derived((data.leaderboard.data ?? []) as LeaderboardEntry[])
  const top3 = $derived(entries.filter((e) => e.rank <= 3))
  const rest = $derived(entries.filter((e) => e.rank > 3))

  function setFilter(key: 'months' | 'type', value: string) {
    const query = buildSearchParams(
      {
        months:
          key === 'months'
            ? ($page.url.searchParams.get('months') === value ? null : value)
            : $page.url.searchParams.get('months'),
        type: key === 'type' ? value : $page.url.searchParams.get('type'),
      },
      $page.url.searchParams,
    )
    goto(`?${query}`, { replaceState: true })
  }
</script>

<div class="mx-auto max-w-2xl space-y-4 pb-8">
  <!-- Header -->
  <div class="flex items-center gap-2.5 px-4 pt-6">
    <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light shadow-md">
      <Trophy class="h-4.5 w-4.5 text-gold-dark" />
    </div>
    <h1 class="text-foreground text-xl font-extrabold">{m.nav_leaderboard()}</h1>
  </div>

  <!-- Tab switcher + period filter -->
  <div class="mx-4 space-y-2">
    <!-- Type tabs -->
    <div class="bg-card border-border shadow-card flex gap-1.5 rounded-2xl border p-1.5">
      {#each TYPE_OPTIONS as tab (tab.value)}
        {@const isActive = data.type === tab.value}
        <button
          type="button"
          class="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200"
          style={isActive
            ? `background: linear-gradient(135deg, ${tab.color}18, ${tab.color}08); color: ${tab.color}; box-shadow: 0 2px 8px ${tab.color}20; border: 1px solid ${tab.color}30;`
            : 'color: var(--muted-foreground);'}
          onclick={() => setFilter('type', tab.value)}
        >
          <tab.icon class="h-4 w-4" />
          {tab.label}
        </button>
      {/each}
    </div>

    <!-- Period filter — scrollable button row -->
    <div class="relative">
      <div class="scrollbar-hide flex gap-1.5 overflow-x-auto rounded-2xl">
        {#each PERIOD_OPTIONS as opt (opt.value)}
          {@const isActive = data.months === opt.value}
          <button
            type="button"
            class={[
              'border-border bg-card shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              isActive
                ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            onclick={() => setFilter('months', opt.value)}
          >
            {opt.label}
          </button>
        {/each}
      </div>
      {#if !data.months}
        <p class="text-muted-foreground mt-1 text-center text-xs">{m.leaderboard_all_time()}</p>
      {/if}
    </div>
  </div>

  {#if entries.length === 0}
    <!-- Empty state -->
    <div class="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div class="bg-primary/8 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
        <Trophy class="text-primary/40 h-8 w-8" />
      </div>
      <p class="text-muted-foreground">{m.common_no_data()}</p>
    </div>
  {:else}
    <!-- Podium — top 3 -->
    {#if top3.length > 0}
      <Podium entries={top3} />
    {/if}

    <!-- Ranked list — rank 4+ -->
    {#if rest.length > 0}
      <div class="space-y-2 px-4 pt-2">
        {#each rest as entry, i (entry.userId)}
          <div class="stagger-item" style="animation-delay: {i * 30}ms">
            <LeaderboardRow {entry} isCurrentUser={entry.userId === currentUserId} />
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
