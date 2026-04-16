<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const rewards = $derived(data.rewards.data ?? [])
  const meta = $derived(data.rewards.meta)
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{m.rewards_catalog_title()}</h1>
  </div>

  <div class="flex items-center gap-2">
    <Badge variant="secondary">{meta?.total ?? rewards.length}</Badge>
  </div>

  {#if rewards.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        {m.rewards_empty()}
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {#each rewards as reward (reward.id)}
        <Card.Root class={reward.isActive ? '' : 'opacity-60'}>
          {#if reward.imageUrl}
            <div class="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
              <img
                src={reward.imageUrl}
                alt={reward.name}
                class="h-full w-full object-cover"
              />
            </div>
          {:else}
            <div class="flex aspect-video w-full items-center justify-center rounded-t-lg bg-muted">
              <span class="text-4xl">{'\u{1F381}'}</span>
            </div>
          {/if}

          <Card.Header class="pb-2">
            <div class="flex items-start justify-between gap-2">
              <Card.Title class="text-base">{reward.name}</Card.Title>
              {#if !reward.isActive}
                <Badge variant="secondary">{m.status_inactive()}</Badge>
              {/if}
            </div>
            {#if reward.description}
              <Card.Description class="line-clamp-2">{reward.description}</Card.Description>
            {/if}
          </Card.Header>

          <Card.Content>
            <div class="flex items-center justify-between">
              <p class="text-lg font-bold tabular-nums">
                {reward.pointCost.toLocaleString('id-ID')} {m.points_poin_aha()}
              </p>
              {#if reward.isActive}
                <Button href="/rewards/{reward.id}/redeem" size="sm">{m.redeem_title()}</Button>
              {:else}
                <Button size="sm" disabled>{m.status_inactive()}</Button>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
