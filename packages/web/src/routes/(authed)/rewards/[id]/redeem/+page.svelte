<script lang="ts">
  import { goto } from '$app/navigation'
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Badge } from '$lib/components/ui/badge'
  import { api } from '$lib/api/client'

  let { data } = $props()

  const reward = $derived(data.reward)

  let notes = $state('')
  let submitting = $state(false)
  let error = $state<string | null>(null)
  let success = $state(false)

  async function handleRedeem() {
    submitting = true
    error = null

    try {
      const result = await api.api.v1.redemptions.post({
        rewardId: reward.id,
        notes: notes.trim() || undefined,
      })

      if (result.error) {
        const msg = (result.error as any)?.value?.error?.message ?? 'Gagal melakukan redemption'
        error = msg
        return
      }

      success = true
      setTimeout(() => goto('/redemptions'), 1500)
    } catch (e) {
      error = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      submitting = false
    }
  }
</script>

<div class="mx-auto max-w-lg space-y-6">
  <div>
    <a href="/rewards" class="text-sm text-muted-foreground hover:underline">← Kembali ke Hadiah</a>
    <h1 class="mt-2 text-2xl font-bold tracking-tight">Konfirmasi Redeem</h1>
  </div>

  <Card.Root>
    {#if reward.imageUrl}
      <div class="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
        <img src={reward.imageUrl} alt={reward.name} class="h-full w-full object-cover" />
      </div>
    {/if}

    <Card.Header>
      <Card.Title>{reward.name}</Card.Title>
      {#if reward.description}
        <Card.Description>{reward.description}</Card.Description>
      {/if}
    </Card.Header>

    <Card.Content class="space-y-4">
      <div class="flex items-center justify-between rounded-lg border p-3">
        <span class="text-sm text-muted-foreground">Biaya poin</span>
        <span class="text-lg font-bold tabular-nums">
          {reward.pointCost.toLocaleString('id-ID')} poin
        </span>
      </div>

      {#if !reward.isActive}
        <Badge variant="destructive" class="w-full justify-center">Hadiah tidak aktif</Badge>
      {:else if success}
        <div class="rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
          Redemption berhasil! Mengalihkan...
        </div>
      {:else}
        <div class="space-y-2">
          <label for="notes" class="text-sm font-medium">Catatan (opsional)</label>
          <textarea
            id="notes"
            bind:value={notes}
            placeholder="Tambahkan catatan untuk permintaan ini..."
            rows="3"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          ></textarea>
        </div>

        {#if error}
          <p class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        {/if}

        <div class="flex gap-3">
          <Button variant="outline" href="/rewards" class="flex-1">Batal</Button>
          <Button onclick={handleRedeem} disabled={submitting} class="flex-1">
            {submitting ? 'Memproses...' : 'Konfirmasi Redeem'}
          </Button>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
