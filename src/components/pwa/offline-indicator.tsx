import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'
import * as m from '~/paraglide/messages'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOffline(!navigator.onLine)

    function handleOffline() {
      setIsOffline(true)
    }
    function handleOnline() {
      setIsOffline(false)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 bg-[#F4C144] px-4 py-2 text-sm font-medium text-[#1D388B] shadow-sm">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>{m.offline_banner()}</span>
    </div>
  )
}
