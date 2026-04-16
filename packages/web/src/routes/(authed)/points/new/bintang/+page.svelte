<script lang="ts">
  import { goto } from '$app/navigation'
  import { toast } from 'svelte-sonner'
  import { api } from '$lib/api/client'
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import EmployeeSelector from '$lib/components/EmployeeSelector.svelte'
  import * as m from '$lib/paraglide/messages'

  let userId = $state('')
  let points = $state(1)
  let reason = $state('')
  let loading = $state(false)

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    loading = true

    try {
      const result = await api.api.v1.points.post({
        userId,
        categoryCode: 'BINTANG',
        points,
        reason,
      })

      if (result.error) {
        const msg = (result.error as any)?.value?.error?.message ?? m.form_error_submission_failed()
        toast.error(msg)
        return
      }

      toast.success(m.points_bintang())
      goto('/points')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.form_error_submission_failed())
    } finally {
      loading = false
    }
  }
</script>

<div class="mx-auto max-w-lg space-y-4">
  <div class="flex items-center gap-2">
    <Button href="/points" variant="outline" size="sm">&larr; {m.common_previous()}</Button>
    <h1 class="text-2xl font-bold">{m.bintang_form_title()}</h1>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>{m.points_bintang()}</Card.Title>
      <Card.Description>{m.point_type_bintang_desc()}</Card.Description>
    </Card.Header>
    <Card.Content>
      <form onsubmit={handleSubmit} class="space-y-4">
        <EmployeeSelector bind:value={userId} disabled={loading} />

        <div class="space-y-1.5">
          <Label for="points">{m.nav_points()}</Label>
          <Input
            id="points"
            type="number"
            min={1}
            max={1}
            bind:value={points}
            required
            disabled={true}
          />
        </div>

        <div class="space-y-1.5">
          <Label for="reason">{m.bintang_form_action()}</Label>
          <Textarea
            id="reason"
            placeholder={m.bintang_form_action_placeholder()}
            bind:value={reason}
            required
            disabled={loading}
            rows={4}
          />
        </div>

        <p class="text-xs text-muted-foreground">{m.form_pending_approval()}</p>

        <Button type="submit" class="w-full" disabled={loading}>
          {#if loading}
            <svg
              class="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {m.common_submitting()}
          {:else}
            {m.bintang_form_submit()}
          {/if}
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
