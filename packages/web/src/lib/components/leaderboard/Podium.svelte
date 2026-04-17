<script lang="ts">
  import { Crown } from 'lucide-svelte'

  type PodiumEntry = {
    rank: number
    name: string
    avatarUrl: string | null
    score: number
  }

  type Props = {
    entries: Array<PodiumEntry>
    scoreLabel?: string
  }

  const RANK_STYLES: Record<
    number,
    {
      avatarRing: string
      podiumBg: string
      podiumHeight: string
      scoreBg: string
      scoreText: string
      glow: string
    }
  > = {
    1: {
      avatarRing: 'ring-4 ring-[#F4C144] glow-gold',
      podiumBg: 'bg-gradient-to-t from-[#F4C144] to-[#FFD97D]',
      podiumHeight: 'h-20',
      scoreBg: 'bg-[#F4C144]/15',
      scoreText: 'text-[#a07700] font-extrabold',
      glow: 'drop-shadow-[0_0_12px_rgba(244,193,68,0.5)]',
    },
    2: {
      avatarRing: 'ring-3 ring-[#C0C0C0]',
      podiumBg: 'bg-gradient-to-t from-[#9a9a9a] to-[#d0d0d0]',
      podiumHeight: 'h-14',
      scoreBg: 'bg-[#C0C0C0]/15',
      scoreText: 'text-muted-foreground font-bold',
      glow: '',
    },
    3: {
      avatarRing: 'ring-3 ring-[#CD7F32]',
      podiumBg: 'bg-gradient-to-t from-[#CD7F32] to-[#E8A862]',
      podiumHeight: 'h-10',
      scoreBg: 'bg-[#CD7F32]/15',
      scoreText: 'text-[#8B5E00] font-bold',
      glow: '',
    },
  }

  let { entries, scoreLabel = '' }: Props = $props()

  const rank1 = $derived(entries.find((e) => e.rank === 1))
  const rank2 = $derived(entries.find((e) => e.rank === 2))
  const rank3 = $derived(entries.find((e) => e.rank === 3))

  function getInitials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
</script>

{#snippet podiumItem(entry: PodiumEntry, size: 'lg' | 'md')}
  {@const styles = RANK_STYLES[entry.rank] ?? {
    avatarRing: '',
    podiumBg: 'bg-muted',
    podiumHeight: 'h-8',
    scoreBg: 'bg-muted',
    scoreText: 'text-muted-foreground',
    glow: '',
  }}
  {@const avatarSize = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14'}
  {@const textSize = size === 'lg' ? 'text-sm font-bold' : 'text-xs font-semibold'}
  {@const scoreTextSize = size === 'lg' ? 'text-base' : 'text-sm'}
  {@const initials = getInitials(entry.name)}

  <div class="relative flex flex-1 flex-col items-center gap-1.5">
    {#if entry.rank === 1}
      <!-- Crown for rank 1 -->
      <div class="mb-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F4C144] to-[#FFD97D] shadow-lg">
        <Crown class="h-4 w-4 text-[#7a5800]" />
      </div>
    {:else}
      <!-- Numbered circle for ranks 2 and 3 -->
      <div class="bg-card mb-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#C0C0C0] shadow-sm">
        <span class="text-muted-foreground text-xs font-bold">{entry.rank}</span>
      </div>
    {/if}

    <!-- Avatar -->
    <div
      class="bg-primary/10 flex shrink-0 items-center justify-center overflow-hidden rounded-full {avatarSize} {styles.avatarRing} {styles.glow}"
    >
      {#if entry.avatarUrl}
        <img
          src={entry.avatarUrl}
          alt={entry.name}
          class="h-full w-full object-cover"
          width={size === 'lg' ? 80 : 56}
          height={size === 'lg' ? 80 : 56}
          loading="lazy"
          decoding="async"
        />
      {:else}
        <span class="text-primary text-lg font-bold">{initials}</span>
      {/if}
    </div>

    <!-- Name -->
    <p class="text-foreground max-w-[80px] truncate text-center {textSize}">
      {entry.name}
    </p>

    <!-- Score -->
    <span class="rounded-full px-2.5 py-0.5 text-xs {styles.scoreBg} {styles.scoreText} {scoreTextSize}">
      {entry.score}
    </span>

    <!-- Podium base -->
    <div class="w-full rounded-t-xl shadow-inner {styles.podiumHeight} {styles.podiumBg}"></div>
  </div>
{/snippet}

{#if rank1 || rank2 || rank3}
  <div class="from-muted to-card border-border shadow-card mx-4 overflow-hidden rounded-2xl border bg-gradient-to-b px-4 pt-6 pb-0">
    <div class="flex items-end justify-center gap-3">
      {#if rank2}
        {@render podiumItem(rank2, 'md')}
      {:else}
        <div class="flex-1"></div>
      {/if}

      {#if rank1}
        {@render podiumItem(rank1, 'lg')}
      {:else}
        <div class="flex-1"></div>
      {/if}

      {#if rank3}
        {@render podiumItem(rank3, 'md')}
      {:else}
        <div class="flex-1"></div>
      {/if}
    </div>
  </div>
{/if}
