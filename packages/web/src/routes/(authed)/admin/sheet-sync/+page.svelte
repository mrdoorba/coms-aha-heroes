<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import * as Table from '$lib/components/ui/table'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  let triggerLoading = $state(false)
  let triggerError = $state<string | null>(null)
  let triggerSuccess = $state(false)

  function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    if (status === 'completed') return 'default'
    if (status === 'running') return 'secondary'
    if (status === 'failed') return 'destructive'
    return 'outline'
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function triggerSync() {
    triggerLoading = true
    triggerError = null
    triggerSuccess = false
    try {
      const res = await fetch('/api/v1/sheet-sync/trigger', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        triggerError = json?.error?.message ?? m.common_something_wrong()
      } else {
        triggerSuccess = true
      }
    } catch {
      triggerError = m.common_something_wrong()
    } finally {
      triggerLoading = false
    }
  }
</script>

<div class="space-y-4">
  <div>
    <h1 class="text-2xl font-bold">{m.nav_sheet_sync()}</h1>
    <p class="text-sm text-muted-foreground">{m.audit_subtitle()}</p>
  </div>

  <!-- Status card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.users_col_status()}</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
      {#if data.status}
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <p class="text-xs text-muted-foreground">{m.users_col_status()}</p>
            <Badge class="mt-1" variant={data.status.isRunning ? 'secondary' : 'outline'}>
              {data.status.isRunning ? m.status_active() : m.status_inactive()}
            </Badge>
          </div>
          <div>
            <p class="text-xs text-muted-foreground">Schedule</p>
            <p class="mt-1 text-sm font-medium">{data.status.schedule}</p>
          </div>
          {#if data.status.lastJob}
            <div>
              <p class="text-xs text-muted-foreground">Last Job</p>
              <Badge class="mt-1" variant={statusVariant(data.status.lastJob.status)}>
                {data.status.lastJob.status}
              </Badge>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">{m.audit_col_timestamp()}</p>
              <p class="mt-1 text-sm font-medium">{formatDate(data.status.lastJob.startedAt)}</p>
            </div>
          {/if}
        </div>
        {#if data.status.lastJob?.error}
          <div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Error:</strong> {data.status.lastJob.error}
          </div>
        {/if}
      {:else}
        <p class="text-sm text-muted-foreground">{m.common_no_data()}</p>
      {/if}

      <div class="flex items-center gap-3 border-t pt-4">
        <Button
          onclick={triggerSync}
          disabled={triggerLoading || data.status?.isRunning}
          size="sm"
        >
          {triggerLoading ? m.common_submitting() : m.nav_sheet_sync()}
        </Button>
        {#if triggerSuccess}
          <p class="text-sm text-green-600">{m.settings_saved()}</p>
        {/if}
        {#if triggerError}
          <p class="text-sm text-destructive">{triggerError}</p>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Job history -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.audit_title()}</Card.Title>
      <Card.Description>{m.audit_total({ total: data.meta.total })}</Card.Description>
    </Card.Header>
    <Card.Content class="p-0">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>{m.reports_start_date()}</Table.Head>
            <Table.Head>{m.reports_end_date()}</Table.Head>
            <Table.Head>{m.users_col_status()}</Table.Head>
            <Table.Head>Rows</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each data.jobs as job (job.id)}
            <Table.Row>
              <Table.Cell class="whitespace-nowrap text-xs">{formatDate(job.startedAt)}</Table.Cell>
              <Table.Cell class="whitespace-nowrap text-xs text-muted-foreground">
                {job.finishedAt ? formatDate(job.finishedAt) : '—'}
              </Table.Cell>
              <Table.Cell>
                <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
              </Table.Cell>
              <Table.Cell class="text-sm">
                {job.rowsProcessed ?? '—'}
              </Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
                {m.common_no_data()}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>
