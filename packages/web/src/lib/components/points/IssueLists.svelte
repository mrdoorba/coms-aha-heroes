<script lang="ts">
  import ResolveDialog from './ResolveDialog.svelte'
  import { CheckCircle2, XCircle, Clock, User as UserIcon } from 'lucide-svelte'
  import * as m from '$lib/paraglide/messages'
  import { userState } from '$lib/state/userState.svelte'

  interface Issue {
    id: string
    status: string
    reason: string
    createdAt: string
    resolvedAt?: string | null
    resolutionNote?: string | null
    user?: { name?: string } | null
    challenger?: { name?: string } | null
  }

  interface Props {
    challenges?: Issue[]
    appeals?: Issue[]
  }

  let { challenges = [], appeals = [] }: Props = $props()

  const isHRorAdmin = $derived(userState.current?.role === 'hr' || userState.current?.role === 'admin')

  let resolveOpen = $state(false)
  let resolveTarget = $state<{ type: 'challenge' | 'appeal'; id: string } | null>(null)

  function openResolve(type: 'challenge' | 'appeal', id: string) {
    resolveTarget = { type, id }
    resolveOpen = true
  }

  type IssueStatus = 'open' | 'upheld' | 'overturned'
  const issueStatusColors: Record<IssueStatus, string> = {
    open: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50',
    upheld: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50',
    overturned: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
  }

  function issueColor(status: string) {
    return issueStatusColors[status as IssueStatus] ?? 'bg-muted text-muted-foreground'
  }
</script>

{#if challenges.length > 0}
  <div class="space-y-4">
    <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
      <span class="w-1.5 h-1.5 rounded-full bg-[#6D50B8]"></span>
      {m.issue_challenges()}
    </h3>
    <div class="space-y-3">
      {#each challenges as challenge (challenge.id)}
        <div class="rounded-xl border border-border bg-card p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-md px-1.5 py-0 text-[10px] font-bold uppercase border {issueColor(challenge.status)}">
                {challenge.status}
              </span>
              <span class="text-xs text-muted-foreground">
                {new Date(challenge.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {#if isHRorAdmin && challenge.status === 'open'}
              <button
                type="button"
                class="text-xs font-medium text-primary hover:underline"
                onclick={() => openResolve('challenge', challenge.id)}
              >
                {m.resolve_submit()}
              </button>
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
              <UserIcon class="h-3 w-3 text-muted-foreground" />
            </div>
            <span class="text-sm font-medium text-foreground">
              {challenge.challenger?.name ?? challenge.user?.name ?? 'Unknown'}
            </span>
          </div>

          <p class="text-sm text-muted-foreground leading-relaxed italic bg-muted/30 p-2 rounded-lg">
            "{challenge.reason}"
          </p>

          {#if challenge.status !== 'open' && challenge.resolutionNote}
            <div class="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
              <div class="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                {#if challenge.status === 'upheld'}
                  <CheckCircle2 class="h-3 w-3" />
                {:else}
                  <XCircle class="h-3 w-3" />
                {/if}
                {m.issue_resolution()}: {challenge.status}
              </div>
              <p class="text-xs text-foreground leading-relaxed">{challenge.resolutionNote}</p>
              {#if challenge.resolvedAt}
                <div class="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Clock class="h-2.5 w-2.5" />
                  {m.issue_resolved_on({ date: new Date(challenge.resolvedAt).toLocaleDateString('id-ID') })}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if appeals.length > 0}
  <div class="space-y-4">
    <h3 class="text-sm font-semibold text-foreground flex items-center gap-2">
      <span class="w-1.5 h-1.5 rounded-full bg-[#F4C144]"></span>
      {m.issue_appeals()}
    </h3>
    <div class="space-y-3">
      {#each appeals as appeal (appeal.id)}
        <div class="rounded-xl border border-border bg-card p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center rounded-md px-1.5 py-0 text-[10px] font-bold uppercase border {issueColor(appeal.status)}">
                {appeal.status}
              </span>
              <span class="text-xs text-muted-foreground">
                {new Date(appeal.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {#if isHRorAdmin && appeal.status === 'open'}
              <button
                type="button"
                class="text-xs font-medium text-primary hover:underline"
                onclick={() => openResolve('appeal', appeal.id)}
              >
                {m.resolve_submit()}
              </button>
            {/if}
          </div>

          <p class="text-sm text-muted-foreground leading-relaxed italic bg-muted/30 p-2 rounded-lg">
            "{appeal.reason}"
          </p>

          {#if appeal.status !== 'open' && appeal.resolutionNote}
            <div class="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-1">
              <div class="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                {#if appeal.status === 'upheld'}
                  <CheckCircle2 class="h-3 w-3" />
                {:else}
                  <XCircle class="h-3 w-3" />
                {/if}
                {m.issue_resolution()}: {appeal.status}
              </div>
              <p class="text-xs text-foreground leading-relaxed">{appeal.resolutionNote}</p>
              {#if appeal.resolvedAt}
                <div class="text-[10px] text-muted-foreground pt-1 flex items-center gap-1">
                  <Clock class="h-2.5 w-2.5" />
                  {m.issue_resolved_on({ date: new Date(appeal.resolvedAt).toLocaleDateString('id-ID') })}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if resolveTarget}
  <ResolveDialog
    type={resolveTarget.type}
    id={resolveTarget.id}
    bind:open={resolveOpen}
    onClose={() => (resolveTarget = null)}
  />
{/if}
