<script lang="ts">
  import * as Card from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'

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

  function statusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'Disetujui'
      case 'rejected': return 'Ditolak'
      case 'pending':  return 'Menunggu'
      default:         return status
    }
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Riwayat Redeem</h1>
    <p class="text-muted-foreground">Semua permintaan penukaran hadiah kamu.</p>
  </div>

  <div class="flex items-center gap-2">
    <Badge variant="secondary">{meta?.total ?? redemptions.length} transaksi</Badge>
  </div>

  {#if redemptions.length === 0}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        Belum ada riwayat redemption.
        <a href="/rewards" class="mt-2 block text-sm text-primary hover:underline">
          Lihat hadiah yang tersedia →
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
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">Hadiah</th>
                <th class="px-4 py-3 text-right font-medium text-muted-foreground">Poin</th>
                <th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th class="px-4 py-3 text-right font-medium text-muted-foreground">Tanggal</th>
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
                      {statusLabel(r.status)}
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
