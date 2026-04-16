<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const notifications = $derived(data.notifications.data ?? [])
  const meta = $derived(data.notifications.meta)
  const unreadCount = $derived(notifications.filter((n: any) => !n.isRead).length)

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

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{m.nav_notifications()}</h1>
  </div>

  <div class="flex items-center gap-2">
    <Badge variant="secondary">{meta?.total ?? notifications.length} {m.nav_notifications().toLowerCase()}</Badge>
    {#if unreadCount > 0}
      <Badge variant="default">{unreadCount}</Badge>
    {/if}
  </div>

  {#if notifications.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        {m.notifications_empty()}
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <Card.Content class="p-0">
        <ul class="divide-y">
          {#each notifications as notif (notif.id)}
            <li
              class="flex items-start gap-3 px-4 py-3 {notif.isRead
                ? ''
                : 'bg-accent/50'}"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-medium">{notif.title}</p>
                  {#if !notif.isRead}
                    <Badge variant="default" class="shrink-0 text-xs">{m.time_just_now()}</Badge>
                  {/if}
                </div>
                {#if notif.body}
                  <p class="mt-0.5 text-sm text-muted-foreground">{notif.body}</p>
                {/if}
                <p class="mt-1 text-xs text-muted-foreground">{formatDate(notif.createdAt)}</p>
              </div>
            </li>
          {/each}
        </ul>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
