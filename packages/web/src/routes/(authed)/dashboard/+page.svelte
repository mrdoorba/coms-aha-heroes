<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import { userState } from '$lib/state/userState.svelte'
  import DashboardStats from '$lib/components/charts/DashboardStats.svelte'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const { summary, activity } = $derived(data)

  // Derive a daily-points sparkline from recent activity
  const sparklineData = $derived.by(() => {
    const grouped: Record<string, number> = {}
    for (const item of activity) {
      const day = item.createdAt.slice(0, 10)
      grouped[day] = (grouped[day] ?? 0) + (item.points > 0 ? item.points : 0)
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }))
  })

  const summaryCards = $derived([
    {
      label: m.dashboard_bintang_count(),
      value: summary.bintangCount,
      description: m.points_bintang(),
    },
    {
      label: m.dashboard_poin_aha_balance(),
      value: summary.poinAhaBalance,
      description: m.points_poin_aha(),
    },
    {
      label: m.dashboard_penalti_points(),
      value: summary.penaltiCount,
      description: m.points_penalti(),
    },
    {
      label: m.dashboard_pending_actions(),
      value: summary.pendingCount,
      description: m.status_pending(),
    },
  ])

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function statusColor(status: string): string {
    switch (status) {
      case 'approved': return 'text-green-600'
      case 'rejected': return 'text-destructive'
      case 'pending':  return 'text-yellow-600'
      default:         return 'text-muted-foreground'
    }
  }
</script>

<div class="space-y-6">
  <!-- Welcome header -->
  <div>
    <h1 class="text-2xl font-bold tracking-tight">
      {m.dashboard_welcome({ name: userState.current?.name ?? 'Hero' })}
    </h1>
    <p class="text-muted-foreground">{m.app_tagline()}</p>
  </div>

  <!-- Summary cards -->
  <section>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {#each summaryCards as card (card.label)}
        <Card.Root>
          <Card.Header class="pb-2">
            <Card.Description>{card.label}</Card.Description>
          </Card.Header>
          <Card.Content>
            <p class="text-3xl font-bold tabular-nums">{card.value.toLocaleString('id-ID')}</p>
            <p class="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  </section>

  <!-- Points activity sparkline -->
  {#if sparklineData.length >= 2}
    <section>
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {m.nav_points()}
      </h2>
      <Card.Root>
        <Card.Content class="pt-4">
          <DashboardStats data={sparklineData} />
        </Card.Content>
      </Card.Root>
    </section>
  {/if}

  <!-- Recent activity -->
  <section>
    <h2 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {m.dashboard_recent_activity()}
    </h2>

    {#if activity.length === 0}
      <Card.Root>
        <Card.Content class="py-10 text-center text-muted-foreground">
          {m.activity_empty()}
        </Card.Content>
      </Card.Root>
    {:else}
      <Card.Root>
        <Card.Content class="p-0">
          <ul class="divide-y">
            {#each activity as item (item.id)}
              <li class="flex items-start gap-3 px-4 py-3">
                <!-- Avatar / icon -->
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase"
                >
                  {item.userName.slice(0, 2)}
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{item.userName}</p>
                  <p class="truncate text-xs text-muted-foreground">
                    {item.categoryName} · {m.point_detail_submitted_by()} {item.submitterName}
                  </p>
                  {#if item.reason}
                    <p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground italic">
                      "{item.reason}"
                    </p>
                  {/if}
                </div>

                <div class="shrink-0 text-right">
                  <p class="text-sm font-semibold tabular-nums">
                    {item.points > 0 ? '+' : ''}{item.points}
                  </p>
                  <p class="text-xs {statusColor(item.status)} capitalize">{item.status}</p>
                  <p class="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                </div>
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    {/if}
  </section>
</div>
