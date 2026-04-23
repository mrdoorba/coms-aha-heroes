<script lang="ts">
  import { goto } from '$app/navigation'
  import * as Card from '$lib/components/ui/card'
  import { Button } from '$lib/components/ui/button'
  import * as m from '$lib/paraglide/messages'
  import { buildSearchParams } from '$lib/utils'

  let { data } = $props()

  const report = $derived(data.report)

  let startDate = $derived(data.filters.startDate ?? '')
  let endDate = $derived(data.filters.endDate ?? '')

  function applyFilters() {
    const query = buildSearchParams({ startDate, endDate })
    goto(`?${query}`, { replaceState: true })
  }

  function clearFilters() {
    startDate = ''
    endDate = ''
    goto('/reports', { replaceState: true })
  }

  const summaryCards = $derived(
    report
      ? [
          { label: m.points_bintang(), value: report.totalBintang },
          { label: m.points_penalti(), value: report.totalPenalti },
          { label: m.points_poin_aha(), value: report.totalPoinAha },
          { label: m.nav_users(), value: report.totalUsers },
          { label: m.status_active(), value: report.activeUsers },
          { label: m.status_pending(), value: report.pendingSubmissions },
        ]
      : [],
  )
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-extrabold">{m.reports_title()}</h1>
    <p class="text-sm text-muted-foreground">{m.reports_subtitle()}</p>
  </div>

  <!-- Filters -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.filter_advanced()}</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label for="start-date" class="text-sm text-muted-foreground">{m.reports_start_date()}</label>
          <input
            id="start-date"
            type="date"
            bind:value={startDate}
            class="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label for="end-date" class="text-sm text-muted-foreground">{m.reports_end_date()}</label>
          <input
            id="end-date"
            type="date"
            bind:value={endDate}
            class="mt-1 block rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div class="flex gap-2">
          <Button size="sm" onclick={applyFilters}>{m.audit_apply_filters()}</Button>
          <Button size="sm" variant="outline" onclick={clearFilters}>{m.filter_clear()}</Button>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  {#if report}
    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {#each summaryCards as card (card.label)}
        <Card.Root>
          <Card.Header class="pb-2">
            <Card.Description>{card.label}</Card.Description>
          </Card.Header>
          <Card.Content>
            <p class="text-3xl font-bold">{card.value.toLocaleString('id-ID')}</p>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    <!-- Top performers -->
    {#if report.topPerformers && report.topPerformers.length > 0}
      <Card.Root>
        <Card.Header>
          <Card.Title>{m.reports_top_teams()}</Card.Title>
          <Card.Description>{m.points_bintang()}</Card.Description>
        </Card.Header>
        <Card.Content>
          <ol class="divide-y">
            {#each report.topPerformers as performer, i (performer.userId)}
              <li class="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div class="flex items-center gap-3">
                  <span class="w-5 text-center font-bold text-muted-foreground">{i + 1}</span>
                  <span class="font-medium">{performer.name}</span>
                </div>
                <span class="text-sm font-semibold">{performer.bintangCount} {m.points_bintang().toLowerCase()}</span>
              </li>
            {/each}
          </ol>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- By branch -->
    {#if report.byBranch && report.byBranch.length > 0}
      <Card.Root>
        <Card.Header>
          <Card.Title>{m.profile_branch()}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="divide-y">
            {#each report.byBranch as branch (branch.branchId)}
              <div class="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span class="font-medium">{branch.branchName}</span>
                <span class="text-sm font-semibold">{branch.bintangCount} {m.points_bintang().toLowerCase()}</span>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    {/if}
  {:else}
    <Card.Root>
      <Card.Content class="py-10 text-center text-muted-foreground">
        {m.common_no_data()}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
