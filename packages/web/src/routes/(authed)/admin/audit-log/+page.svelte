<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { Button } from '$lib/components/ui/button'
  import * as Table from '$lib/components/ui/table'
  import { Badge } from '$lib/components/ui/badge'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const currentPage = $derived(data.meta.page)
  const totalPages = $derived(Math.ceil(data.meta.total / data.meta.limit))

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function goToPage(p: number) {
    const params = new URLSearchParams($page.url.searchParams)
    params.set('page', String(p))
    goto(`?${params.toString()}`, { replaceState: true })
  }

  function actionVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (action.startsWith('create')) return 'default'
    if (action.startsWith('delete') || action.startsWith('archive')) return 'destructive'
    if (action.startsWith('update') || action.startsWith('patch')) return 'secondary'
    return 'outline'
  }
</script>

<div class="space-y-4">
  <div>
    <h1 class="text-2xl font-bold">{m.audit_title()}</h1>
    <p class="text-sm text-muted-foreground">{m.audit_total({ total: data.meta.total })}</p>
  </div>

  <div class="rounded-lg border">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>{m.audit_col_timestamp()}</Table.Head>
          <Table.Head>{m.audit_col_actor()}</Table.Head>
          <Table.Head>{m.audit_col_action()}</Table.Head>
          <Table.Head>{m.audit_entity_label()}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.logs as log (log.id)}
          <Table.Row>
            <Table.Cell class="whitespace-nowrap text-xs text-muted-foreground">
              {formatDate(log.createdAt)}
            </Table.Cell>
            <Table.Cell class="font-medium">{log.actorName ?? log.actorId}</Table.Cell>
            <Table.Cell>
              <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
            </Table.Cell>
            <Table.Cell class="text-sm text-muted-foreground">
              {log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}...` : ''}
            </Table.Cell>
          </Table.Row>
        {:else}
          <Table.Row>
            <Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
              {m.audit_empty()}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>

  {#if totalPages > 1}
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        {m.common_page_of({ page: currentPage, total: totalPages })}
      </p>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onclick={() => goToPage(currentPage - 1)}
        >
          {m.common_previous()}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onclick={() => goToPage(currentPage + 1)}
        >
          {m.common_next()}
        </Button>
      </div>
    </div>
  {/if}
</div>
