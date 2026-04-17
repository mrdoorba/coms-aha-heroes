<script lang="ts">
  type Variant = 'gold' | 'blue' | 'red' | 'pending'

  const VARIANT_STYLES: Record<Variant, {
    gradient: string
    iconBg: string
    iconColor: string
    valueColor: string
    titleColor: string
    glow: string
    border: string
  }> = {
    gold: {
      gradient: 'from-[#F4C144] via-[#F9D46A] to-[#FFD97D]',
      iconBg: 'bg-white/25',
      iconColor: 'text-[#7a5800]',
      valueColor: 'text-[#7a5800]',
      titleColor: 'text-[#7a5800]/80',
      glow: 'shadow-[0_4px_20px_rgba(244,193,68,0.35)]',
      border: 'border-[#F4C144]/30',
    },
    blue: {
      gradient: 'from-[#325FEC] via-[#4B77F0] to-[#759EEE]',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      valueColor: 'text-white',
      titleColor: 'text-white/75',
      glow: 'shadow-[0_4px_20px_rgba(50,95,236,0.35)]',
      border: 'border-[#325FEC]/30',
    },
    red: {
      gradient: 'from-[#C73E3E] via-[#D45555] to-[#E06B6B]',
      iconBg: 'bg-white/20',
      iconColor: 'text-white',
      valueColor: 'text-white',
      titleColor: 'text-white/75',
      glow: 'shadow-[0_4px_20px_rgba(199,62,62,0.30)]',
      border: 'border-[#C73E3E]/30',
    },
    pending: {
      gradient: 'from-card to-card',
      iconBg: 'bg-[#F4C144]/15',
      iconColor: 'text-[#F4C144]',
      valueColor: 'text-foreground',
      titleColor: 'text-muted-foreground',
      glow: 'shadow-card',
      border: 'border-[#F4C144]/25',
    },
  }

  let {
    title,
    value,
    IconComponent,
    variant = 'blue',
    href,
  }: {
    title: string
    value: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    IconComponent?: any
    variant?: Variant
    href?: string
  } = $props()

  const styles = $derived(VARIANT_STYLES[variant])
  const isPending = $derived(variant === 'pending')
</script>

{#snippet cardContent()}
  <div class="relative overflow-hidden rounded-2xl border p-4 shine-on-hover
    {isPending ? 'bg-card' : `bg-gradient-to-br ${styles.gradient}`}
    {styles.border} {styles.glow}
    transition-all duration-200 hover:-translate-y-0.5
    {isPending ? 'hover:shadow-[0_8px_24px_rgba(244,193,68,0.25)]' : 'hover:brightness-105'}">

    <!-- Subtle inner highlight for colored cards -->
    {#if !isPending}
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 to-transparent rounded-2xl"></div>
    {/if}

    <!-- Icon -->
    <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-xl
      {styles.iconBg} {isPending ? 'pulse-gold' : ''}">
      {#if IconComponent}
        <span class="h-5 w-5 {styles.iconColor}">
          <IconComponent class="h-5 w-5" />
        </span>
      {/if}
    </div>

    <!-- Title -->
    <p class="text-[11px] font-semibold leading-tight tracking-wide uppercase {styles.titleColor}">
      {title}
    </p>

    <!-- Value -->
    <p class="stat-enter mt-1.5 text-2xl font-extrabold leading-none tracking-tight {styles.valueColor}">
      {value.toLocaleString()}
    </p>
  </div>
{/snippet}

{#if href}
  <a {href} class="block group">
    {@render cardContent()}
  </a>
{:else}
  {@render cardContent()}
{/if}
