<script lang="ts">
  import * as Card from '$lib/components/ui/card'

  let { data } = $props()

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
</script>

<div class="space-y-4">
  <div>
    <h1 class="text-2xl font-bold">Settings</h1>
    <p class="text-sm text-muted-foreground">Application configuration (admin only)</p>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>System Settings</Card.Title>
      <Card.Description>
        {data.settings.length} configuration entries
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.settings.length === 0}
        <p class="py-4 text-center text-sm text-muted-foreground">No settings found.</p>
      {:else}
        <div class="divide-y">
          {#each data.settings as setting (setting.key)}
            <div class="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">
                <p class="font-mono text-sm font-medium">{setting.key}</p>
                {#if setting.description}
                  <p class="mt-0.5 text-xs text-muted-foreground">{setting.description}</p>
                {/if}
              </div>
              <div class="sm:ml-4 sm:text-right">
                <p class="max-w-xs break-all text-sm">{setting.value}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">
                  Updated {formatDate(setting.updatedAt)}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
