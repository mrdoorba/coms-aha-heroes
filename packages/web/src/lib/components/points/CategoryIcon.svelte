<script lang="ts">
  import { Star, AlertTriangle, Award } from 'lucide-svelte'

  type CategoryCode = 'BINTANG' | 'POIN_AHA' | 'PENALTI'
  type Size = 'sm' | 'md' | 'lg'

  interface Props {
    code: CategoryCode
    size?: Size
    class?: string
  }

  let { code, size = 'md', class: className = '' }: Props = $props()

  const categoryConfig: Record<CategoryCode, { color: string; bg: string; ring: string }> = {
    BINTANG: {
      color: 'text-[#a07700]',
      bg: 'bg-gradient-to-br from-[#F4C144]/20 to-[#FFD97D]/30',
      ring: 'ring-1 ring-[#F4C144]/30',
    },
    PENALTI: {
      color: 'text-[#C73E3E]',
      bg: 'bg-gradient-to-br from-[#C73E3E]/10 to-[#E06B6B]/15',
      ring: 'ring-1 ring-[#C73E3E]/20',
    },
    POIN_AHA: {
      color: 'text-[#325FEC]',
      bg: 'bg-gradient-to-br from-[#325FEC]/10 to-[#759EEE]/20',
      ring: 'ring-1 ring-[#325FEC]/20',
    },
  }

  const sizeClasses: Record<Size, string> = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizes: Record<Size, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const config = $derived(categoryConfig[code])
  const sizeClass = $derived(sizeClasses[size])
  const iconSize = $derived(iconSizes[size])
</script>

<div
  class="flex items-center justify-center rounded-xl shrink-0 {sizeClass} {config.bg} {config.ring} {className}"
>
  {#if code === 'BINTANG'}
    <Star class="{iconSize} {config.color}" />
  {:else if code === 'PENALTI'}
    <AlertTriangle class="{iconSize} {config.color}" />
  {:else}
    <Award class="{iconSize} {config.color}" />
  {/if}
</div>
