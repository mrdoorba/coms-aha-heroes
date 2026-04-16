<script lang="ts">
  import { invalidateAll } from '$app/navigation'
  import { toast } from 'svelte-sonner'
  import { api } from '$lib/api/client'
  import { userState } from '$lib/state/userState.svelte'
  import * as Card from '$lib/components/ui/card'
  import * as Dialog from '$lib/components/ui/dialog'
  import * as Select from '$lib/components/ui/select'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import * as m from '$lib/paraglide/messages'

  let { data } = $props()

  const point = $derived(data.point)
  const challenges = $derived(data.challenges)
  const appeals = $derived(data.appeals)

  // ---- Dialog state ----
  let challengeDialogOpen = $state(false)
  let appealDialogOpen = $state(false)
  let resolveDialogOpen = $state(false)

  // ---- Form state ----
  let challengeReason = $state('')
  let appealReason = $state('')
  let resolveStatus = $state<string>('upheld')
  let resolveNote = $state('')
  let resolveTarget = $state<{ type: 'challenge' | 'appeal'; id: string } | null>(null)
  let submitting = $state(false)

  // ---- Visibility conditions ----
  const isPenalti = $derived(point?.category?.code === 'PENALTI')
  const isActive = $derived(point?.status === 'active')
  const currentUserId = $derived(userState.current?.id)
  const isSubmitter = $derived(point?.submitter?.id === currentUserId)
  const isPenalizedUser = $derived(point?.user?.id === currentUserId)
  const canChallenge = $derived(isPenalti && isActive && !isSubmitter)
  const canAppeal = $derived(isPenalti && isActive && isPenalizedUser)
  const canResolve = $derived(userState.isHR)

  // ---- Lookup maps ----
  const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    pending: 'secondary',
    challenged: 'outline',
    frozen: 'outline',
    revoked: 'destructive',
    rejected: 'destructive',
    upheld: 'default',
    overturned: 'destructive',
  }

  const CATEGORY_LABELS: Record<string, () => string> = {
    BINTANG: () => m.points_bintang(),
    PENALTI: () => m.points_penalti(),
    POIN_AHA: () => m.points_poin_aha(),
  }

  const RESOLVE_OPTIONS = $derived([
    { value: 'upheld', label: m.status_upheld() },
    { value: 'overturned', label: m.status_overturned() },
  ])

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

  // ---- Actions ----
  async function submitChallenge() {
    if (!challengeReason.trim()) return
    submitting = true
    try {
      const result = await api.api.v1.points({ id: point.id }).challenges.post({
        reason: challengeReason.trim(),
      })
      if (result.error) {
        const msg = (result.error as any)?.value?.error?.message ?? m.challenge_failed()
        toast.error(msg)
        return
      }
      toast.success(m.challenge_success())
      challengeReason = ''
      challengeDialogOpen = false
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.challenge_failed())
    } finally {
      submitting = false
    }
  }

  async function submitAppeal() {
    if (!appealReason.trim()) return
    submitting = true
    try {
      const result = await api.api.v1.points({ id: point.id }).appeals.post({
        reason: appealReason.trim(),
      })
      if (result.error) {
        const msg = (result.error as any)?.value?.error?.message ?? m.appeal_failed()
        toast.error(msg)
        return
      }
      toast.success(m.appeal_success())
      appealReason = ''
      appealDialogOpen = false
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.appeal_failed())
    } finally {
      submitting = false
    }
  }

  function openResolveDialog(type: 'challenge' | 'appeal', id: string) {
    resolveTarget = { type, id }
    resolveStatus = 'upheld'
    resolveNote = ''
    resolveDialogOpen = true
  }

  async function submitResolve() {
    if (!resolveTarget || !resolveNote.trim()) return
    submitting = true
    try {
      const body = { status: resolveStatus as 'upheld' | 'overturned', resolutionNote: resolveNote.trim() }
      const result =
        resolveTarget.type === 'challenge'
          ? await api.api.v1.challenges({ id: resolveTarget.id }).resolve.patch(body)
          : await api.api.v1.appeals({ id: resolveTarget.id }).resolve.patch(body)

      if (result.error) {
        const msg =
          (result.error as any)?.value?.error?.message ??
          (resolveTarget.type === 'challenge' ? m.resolve_failed_challenge() : m.resolve_failed_appeal())
        toast.error(msg)
        return
      }
      toast.success(resolveTarget.type === 'challenge' ? m.resolve_success_challenge() : m.resolve_success_appeal())
      resolveDialogOpen = false
      resolveTarget = null
      await invalidateAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.common_something_wrong())
    } finally {
      submitting = false
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-2">
    <Button href="/points" variant="outline" size="sm">&larr; {m.common_previous()}</Button>
    <h1 class="text-2xl font-bold">{m.point_detail_title()}</h1>
  </div>

  <!-- Point card -->
  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between gap-4">
      <Card.Title>
        {CATEGORY_LABELS[point?.category?.code ?? '']?.() ?? point?.category?.name ?? '—'}
      </Card.Title>
      <Badge variant={statusVariant(point?.status ?? '')}>{point?.status ?? '—'}</Badge>
    </Card.Header>

    <Card.Content class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">{m.point_detail_recipient()}</p>
          <p class="mt-1 font-medium">{point?.user?.name ?? '—'}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">{m.nav_points()}</p>
          <p class="mt-1 font-semibold text-2xl">{point?.points ?? '—'}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">{m.point_detail_submitted_by()}</p>
          <p class="mt-1">{point?.submitter?.name ?? '—'}</p>
        </div>
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">{m.employee_detail_col_date()}</p>
          <p class="mt-1">{formatDate(point?.createdAt)}</p>
        </div>
      </div>

      {#if point?.reason}
        <div>
          <p class="text-xs font-medium uppercase text-muted-foreground">{m.point_detail_reason()}</p>
          <p class="mt-1 text-sm">{point.reason}</p>
        </div>
      {/if}
    </Card.Content>

    {#if canChallenge || canAppeal}
      <Card.Footer class="flex gap-2">
        {#if canChallenge}
          <Button variant="outline" onclick={() => (challengeDialogOpen = true)}>
            {m.point_action_challenge()}
          </Button>
        {/if}
        {#if canAppeal}
          <Button variant="outline" onclick={() => (appealDialogOpen = true)}>
            {m.point_action_appeal()}
          </Button>
        {/if}
      </Card.Footer>
    {/if}
  </Card.Root>

  <!-- Challenges section -->
  {#if Array.isArray(challenges) && challenges.length > 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>{m.issue_challenges()}</Card.Title>
        <Card.Description>{m.challenge_description()}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="divide-y">
          {#each challenges as challenge (challenge.id)}
            <div class="py-3 first:pt-0 last:pb-0 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{challenge.user?.name ?? m.common_unknown()}</span>
                  <Badge variant={statusVariant(challenge.status ?? 'pending')}>
                    {challenge.status ?? m.status_pending()}
                  </Badge>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">{formatDate(challenge.createdAt)}</span>
                  {#if canResolve && challenge.status === 'pending'}
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => openResolveDialog('challenge', challenge.id)}
                    >
                      {m.resolve_submit()}
                    </Button>
                  {/if}
                </div>
              </div>
              <p class="text-sm text-muted-foreground">{challenge.reason}</p>
              {#if challenge.resolutionNote}
                <div class="rounded-md bg-muted px-3 py-2 text-sm">
                  <span class="font-medium">{m.issue_resolution()}:</span> {challenge.resolutionNote}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Appeals section -->
  {#if Array.isArray(appeals) && appeals.length > 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>{m.issue_appeals()}</Card.Title>
        <Card.Description>{m.appeal_description()}</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="divide-y">
          {#each appeals as appeal (appeal.id)}
            <div class="py-3 first:pt-0 last:pb-0 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{appeal.user?.name ?? m.common_unknown()}</span>
                  <Badge variant={statusVariant(appeal.status ?? 'pending')}>
                    {appeal.status ?? m.status_pending()}
                  </Badge>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-muted-foreground">{formatDate(appeal.createdAt)}</span>
                  {#if canResolve && appeal.status === 'pending'}
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => openResolveDialog('appeal', appeal.id)}
                    >
                      {m.resolve_submit()}
                    </Button>
                  {/if}
                </div>
              </div>
              <p class="text-sm text-muted-foreground">{appeal.reason}</p>
              {#if appeal.resolutionNote}
                <div class="rounded-md bg-muted px-3 py-2 text-sm">
                  <span class="font-medium">{m.issue_resolution()}:</span> {appeal.resolutionNote}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  {/if}
</div>

<!-- Challenge dialog -->
<Dialog.Root bind:open={challengeDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{m.challenge_title()}</Dialog.Title>
      <Dialog.Description>
        {m.challenge_description()}
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={(e) => { e.preventDefault(); submitChallenge() }} class="space-y-4">
      <div class="space-y-1.5">
        <Label for="challenge-reason">{m.challenge_reason_label()}</Label>
        <Textarea
          id="challenge-reason"
          placeholder={m.challenge_reason_placeholder()}
          bind:value={challengeReason}
          required
          disabled={submitting}
          rows={4}
        />
      </div>
      <p class="text-xs text-muted-foreground">{m.challenge_note()}</p>
      <Dialog.Footer>
        <Button variant="outline" type="button" onclick={() => (challengeDialogOpen = false)}>
          {m.common_cancel()}
        </Button>
        <Button type="submit" disabled={submitting || !challengeReason.trim()}>
          {#if submitting}{m.common_submitting()}{:else}{m.challenge_submit()}{/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Appeal dialog -->
<Dialog.Root bind:open={appealDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{m.appeal_title()}</Dialog.Title>
      <Dialog.Description>
        {m.appeal_description()}
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={(e) => { e.preventDefault(); submitAppeal() }} class="space-y-4">
      <div class="space-y-1.5">
        <Label for="appeal-reason">{m.appeal_reason_label()}</Label>
        <Textarea
          id="appeal-reason"
          placeholder={m.appeal_reason_placeholder()}
          bind:value={appealReason}
          required
          disabled={submitting}
          rows={4}
        />
      </div>
      <p class="text-xs text-muted-foreground">{m.appeal_frozen_note()}</p>
      <Dialog.Footer>
        <Button variant="outline" type="button" onclick={() => (appealDialogOpen = false)}>
          {m.common_cancel()}
        </Button>
        <Button type="submit" disabled={submitting || !appealReason.trim()}>
          {#if submitting}{m.common_submitting()}{:else}{m.appeal_submit()}{/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Resolve dialog (HR/Admin) -->
<Dialog.Root bind:open={resolveDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {resolveTarget?.type === 'challenge' ? m.resolve_challenge_title() : m.resolve_appeal_title()}
      </Dialog.Title>
      <Dialog.Description>
        {resolveTarget?.type === 'challenge' ? m.resolve_description_challenge() : m.resolve_description_appeal()}
      </Dialog.Description>
    </Dialog.Header>
    <form onsubmit={(e) => { e.preventDefault(); submitResolve() }} class="space-y-4">
      <div class="space-y-1.5">
        <Label for="resolve-status">{m.resolve_decision_label()}</Label>
        <Select.Root type="single" bind:value={resolveStatus}>
          <Select.Trigger class="w-full">
            {RESOLVE_OPTIONS.find((o) => o.value === resolveStatus)?.label ?? m.resolve_decision_label()}
          </Select.Trigger>
          <Select.Content>
            {#each RESOLVE_OPTIONS as option (option.value)}
              <Select.Item value={option.value} label={option.label} />
            {/each}
          </Select.Content>
        </Select.Root>
      </div>
      <div class="space-y-1.5">
        <Label for="resolve-note">{m.resolve_note_label()}</Label>
        <Textarea
          id="resolve-note"
          placeholder={m.resolve_note_placeholder()}
          bind:value={resolveNote}
          required
          disabled={submitting}
          rows={4}
        />
      </div>
      <Dialog.Footer>
        <Button variant="outline" type="button" onclick={() => (resolveDialogOpen = false)}>
          {m.common_cancel()}
        </Button>
        <Button type="submit" disabled={submitting || !resolveNote.trim()}>
          {#if submitting}{m.common_submitting()}{:else}{m.resolve_submit()}{/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
