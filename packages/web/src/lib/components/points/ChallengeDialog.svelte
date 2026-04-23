<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { toast } from 'svelte-sonner'
  import { api } from '$lib/api/client'
  import * as Dialog from '$lib/components/ui/dialog'
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import * as m from '$lib/paraglide/messages'
  import { getErrorMessage } from '$lib/api/client'

  interface Props {
    pointId: string
    open?: boolean
    onClose?: () => void
  }

  let { pointId, open = $bindable(false), onClose }: Props = $props()

  let reason = $state('')
  let isSubmitting = $state(false)

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!reason.trim()) return

    isSubmitting = true
    try {
      const result = await api.api.v1.points({ id: pointId }).challenges.post({ reason: reason.trim() })
      if (result.error) {
        toast.error(getErrorMessage(result.error, m.challenge_failed()))
        return
      }
      toast.success(m.challenge_success())
      open = false
      reason = ''
      onClose?.()
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.challenge_failed())
    } finally {
      isSubmitting = false
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[425px] rounded-[20px]">
    <Dialog.Header>
      <Dialog.Title>{m.challenge_title()}</Dialog.Title>
      <Dialog.Description>{m.challenge_description()}</Dialog.Description>
    </Dialog.Header>
    <form onsubmit={onSubmit} class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="challenge-reason">{m.challenge_reason_label()}</Label>
        <Textarea
          id="challenge-reason"
          placeholder={m.challenge_reason_placeholder()}
          bind:value={reason}
          class="min-h-[120px] rounded-xl"
          disabled={isSubmitting}
        />
      </div>
      <div class="p-3 rounded-lg bg-primary/10 border border-primary/15 dark:bg-primary/10 dark:border-primary/20">
        <p class="text-xs text-primary leading-relaxed">
          <strong>Note:</strong> {m.challenge_note()}
        </p>
      </div>
      <Dialog.Footer>
        <Button
          type="button"
          variant="outline"
          onclick={() => { open = false; onClose?.() }}
        >
          {m.common_cancel()}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !reason.trim()}
          class="bg-primary hover:bg-primary/80 rounded-xl"
        >
          {#if isSubmitting}{m.common_submitting()}{:else}{m.challenge_submit()}{/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
