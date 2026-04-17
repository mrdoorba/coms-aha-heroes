<script lang="ts">
  import { Star, AlertTriangle, Award } from 'lucide-svelte'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    userRole: string
    class?: string
  }

  let { userRole, class: className = '' }: Props = $props()

  type PointTypeBase = {
    code: string
    color: string
    bg: string
    border: string
    href: string
    roles: readonly string[]
  }

  const pointTypeBases: PointTypeBase[] = [
    {
      code: 'bintang',
      color: 'text-yellow-500',
      bg: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30',
      border: 'border-yellow-200 dark:border-yellow-800/50',
      href: '/points/new/bintang',
      roles: ['admin', 'hr', 'leader', 'employee'],
    },
    {
      code: 'penalti',
      color: 'text-purple-500',
      bg: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30',
      border: 'border-purple-200 dark:border-purple-800/50',
      href: '/points/new/penalti',
      roles: ['admin', 'hr', 'leader'],
    },
    {
      code: 'poin-aha',
      color: 'text-blue-500',
      bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      href: '/points/new/poin-aha',
      roles: ['admin', 'hr', 'leader'],
    },
  ]

  const pointTypes = $derived([
    { ...pointTypeBases[0], label: m.points_bintang(), description: m.point_type_bintang_desc() },
    { ...pointTypeBases[1], label: m.points_penalti(), description: m.point_type_penalti_desc() },
    { ...pointTypeBases[2], label: m.points_poin_aha(), description: m.point_type_poin_aha_desc() },
  ])

  const available = $derived(pointTypes.filter((t) => t.roles.includes(userRole)))
</script>

<div class="grid gap-3 {className}">
  {#each available as type (type.code)}
    <a
      href={type.href}
      class="flex items-center gap-4 rounded-xl border p-4 transition-colors {type.bg} {type.border}"
    >
      <div class="flex items-center justify-center h-12 w-12 rounded-xl bg-card/80">
        {#if type.code === 'bintang'}
          <Star class="h-6 w-6 {type.color}" />
        {:else if type.code === 'penalti'}
          <AlertTriangle class="h-6 w-6 {type.color}" />
        {:else}
          <Award class="h-6 w-6 {type.color}" />
        {/if}
      </div>
      <div>
        <p class="font-semibold text-sm text-foreground">{type.label}</p>
        <p class="text-xs text-muted-foreground">{type.description}</p>
      </div>
    </a>
  {/each}
</div>
