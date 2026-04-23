<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { toast } from 'svelte-sonner'
  import { api } from '$lib/api/client'
  import * as Dialog from '$lib/components/ui/dialog'
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { AlertCircle } from 'lucide-svelte'
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
      const result = await api.api.v1.points({ id: pointId }).appeals.post({ reason: reason.trim() })
      if (result.error) {
        toast.error(getErrorMessage(result.error, m.appeal_failed()))
        return
      }
      toast.success(m.appeal_success())
      open = false
      reason = ''
      onClose?.()
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.appeal_failed())
    } finally {
      isSubmitting = false
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[425px] rounded-[20px]">
    <Dialog.Header>
      <Dialog.Title>{m.appeal_title()}</Dialog.Title>
      <Dialog.Description>{m.appeal_description()}</Dialog.Description>
    </Dialog.Header>
    <form onsubmit={onSubmit} class="grid gap-4 py-4">
      <div class="flex gap-3 p-3 rounded-lg bg-status-pending-bg border border-status-pending/20 dark:bg-status-pending-bg dark:border-status-pending/20">
        <AlertCircle class="h-5 w-5 text-status-pending shrink-0" />
        <p class="text-xs text-status-pending leading-relaxed">
          <strong>Point Frozen:</strong> {m.appeal_frozen_note()}
        </p>
      </div>
      <div class="grid gap-2">
        <Label for="appeal-reason">{m.appeal_reason_label()}</Label>
        <Textarea
          id="appeal-reason"
          placeholder={m.appeal_reason_placeholder()}
          bind:value={reason}
          class="min-h-[120px] rounded-xl"
          disabled={isSubmitting}
        />
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
          {#if isSubmitting}{m.common_submitting()}{:else}{m.appeal_submit()}{/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
