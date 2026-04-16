<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const teams = $derived(data.teams.data ?? [])
  const meta = $derived(data.teams.meta)
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{m.nav_teams()}</h1>
  </div>

  <div class="flex items-center gap-2">
    <Badge variant="secondary">{m.teams_total({ count: meta?.total ?? teams.length })}</Badge>
  </div>

  {#if teams.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        {m.teams_empty()}
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {#each teams as team (team.id)}
        <Card.Root>
          <Card.Header class="pb-2">
            <Card.Title class="text-base">{team.name}</Card.Title>
            <Card.Description>{m.profile_branch()}: {team.branchCode ?? team.branchId}</Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="space-y-1 text-sm text-muted-foreground">
              {#if team.memberCount !== undefined}
                <p>{m.teams_members({ count: team.memberCount })}</p>
              {/if}
              {#if team.leaderName}
                <p><span class="font-medium text-foreground">{team.leaderName}</span></p>
              {:else}
                <p>{m.teams_no_leader()}</p>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
