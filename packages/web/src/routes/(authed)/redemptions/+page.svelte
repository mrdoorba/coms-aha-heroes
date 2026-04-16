<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const redemptions = $derived(data.redemptions.data ?? [])
  const meta = $derived(data.redemptions.meta)

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'pending':  return 'secondary'
      default:         return 'outline'
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{m.redemptions_title()}</h1>
    <p class="text-muted-foreground">{m.redemptions_my_requests()}</p>
  </div>

  <div class="flex items-center gap-2">
    <Badge variant="secondary">{meta?.total ?? redemptions.length}</Badge>
  </div>

  {#if redemptions.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        {m.redemptions_empty()}
        <a href="/rewards" class="mt-2 block text-sm text-primary hover:underline">
          {m.rewards_catalog_title()} &rarr;
        </a>
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <Card.Content class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/50">
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">{m.nav_rewards()}</th>
                <th class="px-4 py-3 text-right font-medium text-muted-foreground">{m.nav_points()}</th>
                <th class="px-4 py-3 text-center font-medium text-muted-foreground">{m.users_col_status()}</th>
                <th class="px-4 py-3 text-right font-medium text-muted-foreground">{m.employee_detail_col_date()}</th>
              </tr>
            </thead>
            <tbody>
              {#each redemptions as r (r.id)}
                <tr class="border-b last:border-0 hover:bg-muted/30">
                  <td class="px-4 py-3 font-medium">{r.rewardName}</td>
                  <td class="px-4 py-3 text-right tabular-nums">
                    {r.pointsSpent.toLocaleString('id-ID')}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <Badge variant={statusVariant(r.status)} class="capitalize">
                      {r.status}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
