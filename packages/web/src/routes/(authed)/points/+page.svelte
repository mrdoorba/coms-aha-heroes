<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { userState } from '$lib/state/userState.svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'

  let { data } = $props()

  const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    pending: 'secondary',
    challenged: 'outline',
    frozen: 'outline',
    revoked: 'destructive',
    rejected: 'destructive',
  }

  const CATEGORY_LABELS: Record<string, string> = {
    BINTANG: 'Bintang',
    PENALTI: 'Penalti',
    POIN_AHA: 'Poin AHA',
  }

  function statusVariant(status: string) {
    return STATUS_VARIANT[status] ?? 'secondary'
  }

  function handleStatusFilter(e: Event) {
    const val = (e.target as HTMLSelectElement).value
    const params = new URLSearchParams($page.url.searchParams)
    if (val) {
      params.set('status', val)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    goto(`/points?${params.toString()}`)
  }
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-bold">Points</h1>
    {#if userState.current?.canSubmitPoints}
      <div class="flex flex-wrap gap-2">
        <Button href="/points/new/bintang" size="sm">+ Bintang</Button>
        <Button href="/points/new/penalti" size="sm" variant="outline">+ Penalti</Button>
        <Button href="/points/new/poin-aha" size="sm" variant="secondary">+ Poin AHA</Button>
      </div>
    {/if}
  </div>

  <!-- Status filter -->
  <div class="flex items-center gap-2">
    <label for="status-filter" class="text-sm text-muted-foreground">Status:</label>
    <select
      id="status-filter"
      class="rounded-md border bg-background px-2 py-1 text-sm"
      value={data.status}
      onchange={handleStatusFilter}
    >
      <option value="">All</option>
      <option value="pending">Pending</option>
      <option value="active">Active</option>
      <option value="challenged">Challenged</option>
      <option value="frozen">Frozen</option>
      <option value="revoked">Revoked</option>
      <option value="rejected">Rejected</option>
    </select>
  </div>

  <!-- Points list -->
  {#if data.points && data.points.length > 0}
    <div class="overflow-hidden rounded-lg border">
      <ul class="divide-y">
        {#each data.points as point (point.id)}
          <li>
            <a
              href="/points/{point.id}"
              class="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{point.user?.name ?? '—'}</p>
                <p class="text-sm text-muted-foreground">
                  {CATEGORY_LABELS[point.category?.code ?? ''] ?? point.category?.name ?? '—'}
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-semibold">{point.points}</span>
                <Badge variant={statusVariant(point.status)}>{point.status}</Badge>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="py-8 text-center text-muted-foreground">No points found.</p>
  {/if}

  <!-- Pagination -->
  {#if data.meta && data.meta.total > data.meta.limit}
    <div class="flex justify-center gap-2">
      {#if data.meta.page > 1}
        <Button
          variant="outline"
          size="sm"
          href="/points?page={data.meta.page - 1}{data.status ? `&status=${data.status}` : ''}"
        >
          Previous
        </Button>
      {/if}
      <span class="flex items-center px-2 text-sm text-muted-foreground">
        Page {data.meta.page} of {Math.ceil(data.meta.total / data.meta.limit)}
      </span>
      {#if data.meta.page < Math.ceil(data.meta.total / data.meta.limit)}
        <Button
          variant="outline"
          size="sm"
          href="/points?page={data.meta.page + 1}{data.status ? `&status=${data.status}` : ''}"
        >
          Next
        </Button>
      {/if}
    </div>
  {/if}
</div>
