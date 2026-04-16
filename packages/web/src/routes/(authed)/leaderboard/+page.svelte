<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { Button } from '$lib/components/ui/button'
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import * as Avatar from '$lib/components/ui/avatar'

  let { data } = $props()

  const TYPE_OPTIONS: { value: 'bintang' | 'poin_aha' | 'penalti'; label: string }[] = [
    { value: 'bintang', label: 'Bintang' },
    { value: 'poin_aha', label: 'Poin AHA' },
    { value: 'penalti', label: 'Penalti' },
  ]

  const PERIOD_OPTIONS: { value: string; label: string }[] = [
    { value: '1', label: '1 Bulan' },
    { value: '2', label: '2 Bulan' },
    { value: '3', label: '3 Bulan' },
    { value: '6', label: '6 Bulan' },
    { value: '12', label: '12 Bulan' },
  ]

  const entries = $derived(data.leaderboard.data ?? [])
  const top3 = $derived(entries.filter((e: any) => e.rank <= 3))
  const rest = $derived(entries.filter((e: any) => e.rank > 3))

  function getInitials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  function setFilter(key: 'months' | 'type', value: string) {
    const params = new URLSearchParams($page.url.searchParams)
    if (key === 'months') {
      // Toggle: clicking the active button deselects it
      if (params.get('months') === value) {
        params.delete('months')
      } else {
        params.set('months', value)
      }
    } else {
      params.set('type', value)
    }
    goto(`?${params.toString()}`, { replaceState: true })
  }

  const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
</script>

<div class="space-y-4">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <h1 class="text-2xl font-bold">Leaderboard</h1>
    <Badge variant="secondary">{data.leaderboard.meta?.total ?? 0} peserta</Badge>
  </div>

  <!-- Type filter -->
  <div class="flex gap-2">
    {#each TYPE_OPTIONS as opt (opt.value)}
      <Button
        variant={data.type === opt.value ? 'default' : 'outline'}
        size="sm"
        onclick={() => setFilter('type', opt.value)}
      >
        {opt.label}
      </Button>
    {/each}
  </div>

  <!-- Period filter — scrollable button row -->
  <div class="relative">
    <div class="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1">
      {#each PERIOD_OPTIONS as opt (opt.value)}
        {@const isActive = data.months === opt.value}
        <button
          type="button"
          class={[
            'shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200',
            isActive
              ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:text-foreground',
          ].join(' ')}
          onclick={() => setFilter('months', opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
    {#if !data.months}
      <p class="text-muted-foreground mt-1 text-center text-xs">Semua waktu</p>
    {/if}
  </div>

  <!-- Podium — top 3 -->
  {#if top3.length > 0}
    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-base">Top 3</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex items-end justify-center gap-4">
          {#each [top3.find((e: any) => e.rank === 2), top3.find((e: any) => e.rank === 1), top3.find((e: any) => e.rank === 3)].filter(Boolean) as entry (entry.rank)}
            {@const isFirst = entry.rank === 1}
            <div
              class={[
                'flex flex-col items-center gap-1',
                isFirst ? 'order-2 scale-110' : entry.rank === 2 ? 'order-1' : 'order-3',
              ].join(' ')}
            >
              <span class="text-2xl">{MEDAL[entry.rank] ?? ''}</span>
              <Avatar.Root class={isFirst ? 'h-16 w-16' : 'h-12 w-12'}>
                {#if entry.avatarUrl}
                  <Avatar.Image src={entry.avatarUrl} alt={entry.name} />
                {/if}
                <Avatar.Fallback class={isFirst ? 'text-base' : 'text-sm'}>
                  {getInitials(entry.name)}
                </Avatar.Fallback>
              </Avatar.Root>
              <p class="max-w-[80px] truncate text-center text-xs font-semibold">{entry.name}</p>
              <Badge variant={isFirst ? 'default' : 'secondary'} class="text-xs">
                {entry.score}
              </Badge>
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Full ranked list -->
  {#if entries.length === 0}
    <Card.Root>
      <Card.Content class="py-12 text-center text-muted-foreground">
        Belum ada data untuk periode ini.
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <Card.Content class="p-0">
        <ul class="divide-y">
          {#each entries as entry (entry.userId)}
            <li class="flex items-center gap-3 px-4 py-3">
              <!-- Rank badge -->
              <div
                class={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                  entry.rank === 1
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : entry.rank === 2
                      ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      : entry.rank === 3
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-muted text-muted-foreground',
                ].join(' ')}
              >
                {entry.rank <= 3 ? MEDAL[entry.rank] : entry.rank}
              </div>

              <!-- Avatar -->
              <Avatar.Root class="h-9 w-9 shrink-0">
                {#if entry.avatarUrl}
                  <Avatar.Image src={entry.avatarUrl} alt={entry.name} />
                {/if}
                <Avatar.Fallback class="text-xs">{getInitials(entry.name)}</Avatar.Fallback>
              </Avatar.Root>

              <!-- Name -->
              <span class="flex-1 truncate text-sm font-medium">{entry.name}</span>

              <!-- Score -->
              <Badge variant="outline" class="shrink-0 font-mono text-xs">
                {entry.score}
              </Badge>
            </li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
