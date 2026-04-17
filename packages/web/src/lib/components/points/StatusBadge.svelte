<script lang="ts">
  interface Props {
    status: string
    class?: string
  }

  let { status, class: className = '' }: Props = $props()

  type StatusConfig = { label: string; className: string }

  const statusConfig: Record<string, StatusConfig> = {
    active: {
      label: 'Active',
      className:
        'bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    },
    pending: {
      label: 'Pending',
      className:
        'bg-[#F4C144]/10 text-[#a07700] border border-[#F4C144]/30 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/40',
    },
    challenged: {
      label: 'Challenged',
      className:
        'bg-purple-50 text-purple-700 border border-purple-200/70 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/50',
    },
    frozen: {
      label: 'Frozen',
      className:
        'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
    },
    revoked: {
      label: 'Revoked',
      className:
        'bg-red-50 text-red-600 border border-red-200/70 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
    },
    rejected: {
      label: 'Rejected',
      className:
        'bg-red-50 text-red-600 border border-red-200/70 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
    },
  }

  const config = $derived(statusConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground border border-border' })
</script>

<span
  class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold leading-none tracking-wide {config.className} {className}"
>
  {config.label}
</span>
