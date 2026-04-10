import { useState, useRef, useCallback, type ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'

const THRESHOLD = 60
const MAX_PULL = 100

interface PullToRefreshProps {
  children: ReactNode
  className?: string
}

export function PullToRefresh({ children, className }: PullToRefreshProps) {
  const router = useRouter()
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (refreshing) return
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop
      if (scrollTop > 0) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    },
    [refreshing],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return
      const diff = e.touches[0].clientY - startY.current
      if (diff < 0) {
        pulling.current = false
        setPullDistance(0)
        return
      }
      const dampened = Math.min(diff * 0.4, MAX_PULL)
      setPullDistance(dampened)
    },
    [refreshing],
  )

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false

    if (pullDistance >= THRESHOLD) {
      setRefreshing(true)
      setPullDistance(THRESHOLD)
      await router.invalidate()
      setRefreshing(false)
    }
    setPullDistance(0)
  }, [pullDistance, router])

  const showIndicator = pullDistance > 10 || refreshing

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {showIndicator && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-200 md:hidden"
          style={{ height: refreshing ? 40 : pullDistance * 0.6 }}
        >
          <Loader2
            className={`h-5 w-5 text-primary ${refreshing ? 'animate-spin' : ''}`}
            style={{
              opacity: Math.min(pullDistance / THRESHOLD, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}
      {children}
    </div>
  )
}
