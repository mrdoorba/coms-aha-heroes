import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import * as m from '~/paraglide/messages'

const DISMISSED_KEY = 'aha-pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISSED_KEY)) return

    function handlePrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 bg-[#325FEC] px-4 py-2.5 text-white shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <Download className="h-4 w-4 shrink-0" />
        <span className="font-medium">{m.pwa_install_message()}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-[#325FEC] hover:bg-white/90"
        >
          {m.pwa_install_button()}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10"
          aria-label={m.pwa_dismiss()}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
