<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'

  let { data } = $props()

  const point = $derived(data.point)

  const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    pending: 'secondary',
    challenged: 'outline',
    frozen: 'outline',
    revoked: 'destructive',
    rejected: 'destructive',
  }

  const CATEGORY_LABELS: Record<string, string> = {
    BINTANG: 'Poin Bintang sAHAbat',
    PENALTI: 'Poin Penalti Staff AHA',
    POIN_AHA: 'Poin AHA',
  }

  function statusVariant(status: string) {
    return STATUS_VARIANT[status] ?? 'secondary'
  }

  function formatDate(date: string | null | undefined) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-2">
    <Button href="/points" variant="outline" size="sm">← Back</Button>
    <h1 class="text-2xl font-bold">Point Detail</h1>
  </div>

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between gap-4">
      <Card.Title>
        {CATEGORY_LABELS[point?.category?.code ?? ''] ?? point?.category?.name ?? '—'}
      </Card.Title>
      <Badge variant={statusVariant(point?.status ?? '')}>{point?.status ?? '—'}</Badge>
    </Card.Header>

    <Card.Content class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">User</p>
          <p class="mt-1 font-medium">{point?.user?.name ?? '—'}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">Points</p>
          <p class="mt-1 font-semibold text-2xl">{point?.points ?? '—'}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">Submitted by</p>
          <p class="mt-1">{point?.submitter?.name ?? '—'}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">Date</p>
          <p class="mt-1">{formatDate(point?.createdAt)}</p>
        </div>
      </div>

      {#if point?.reason}
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">Description</p>
          <p class="mt-1 text-sm">{point.reason}</p>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
