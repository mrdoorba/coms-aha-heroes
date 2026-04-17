<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { toast } from 'svelte-sonner'
  import { api } from '$lib/api/client'
  import * as Dialog from '$lib/components/ui/dialog'
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Check, X } from 'lucide-svelte'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    type: 'challenge' | 'appeal'
    id: string
    open?: boolean
    onClose?: () => void
  }

  let { type, id, open = $bindable(false), onClose }: Props = $props()

  let status = $state<'upheld' | 'overturned'>('upheld')
  let resolutionNote = $state('')
  let isSubmitting = $state(false)

  async function onSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!resolutionNote.trim()) return

    isSubmitting = true
    try {
      const body = { status, resolutionNote: resolutionNote.trim() }
      const result =
        type === 'challenge'
          ? await api.api.v1.challenges({ id }).resolve.patch(body)
          : await api.api.v1.appeals({ id }).resolve.patch(body)

      if (result.error) {
        const msg =
          (result.error as any)?.value?.error?.message ??
          (type === 'challenge' ? m.resolve_failed_challenge() : m.resolve_failed_appeal())
        toast.error(msg)
        return
      }
      toast.success(type === 'challenge' ? m.resolve_success_challenge() : m.resolve_success_appeal())
      open = false
      resolutionNote = ''
      onClose?.()
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.common_something_wrong())
    } finally {
      isSubmitting = false
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[425px] rounded-[20px]">
    <Dialog.Header>
      <Dialog.Title>
        {type === 'challenge' ? m.resolve_challenge_title() : m.resolve_appeal_title()}
      </Dialog.Title>
      <Dialog.Description>
        {type === 'challenge' ? m.resolve_description_challenge() : m.resolve_description_appeal()}
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={onSubmit} class="grid gap-6 py-4">
      <div class="grid gap-3">
        <Label>{m.resolve_decision_label()}</Label>
        <div class="flex p-1 bg-muted rounded-xl gap-1">
          <button
            type="button"
            onclick={() => (status = 'upheld')}
            class="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all {status === 'upheld' ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:bg-card/50'}"
          >
            <Check class="h-4 w-4 {status === 'upheld' ? 'opacity-100' : 'opacity-0'}" />
            {m.status_upheld()}
          </button>
          <button
            type="button"
            onclick={() => (status = 'overturned')}
            class="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all {status === 'overturned' ? 'bg-card text-destructive shadow-sm' : 'text-muted-foreground hover:bg-card/50'}"
          >
            <X class="h-4 w-4 {status === 'overturned' ? 'opacity-100' : 'opacity-0'}" />
            {m.status_overturned()}
          </button>
        </div>
      </div>
      <div class="grid gap-2">
        <Label for="resolution-note">{m.resolve_note_label()}</Label>
        <Textarea
          id="resolution-note"
          placeholder={m.resolve_note_placeholder()}
          bind:value={resolutionNote}
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
          disabled={isSubmitting || !resolutionNote.trim()}
          class="bg-primary hover:bg-primary/80 rounded-xl"
        >
          {#if isSubmitting}{m.common_submitting()}{:else}{m.resolve_submit()}{/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
