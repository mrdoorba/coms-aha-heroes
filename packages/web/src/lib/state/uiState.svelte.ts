import { browser } from '$app/environment'

class UIState {
  sidebarCollapsed = $state(false)
  theme = $state<'light' | 'dark' | 'system'>('system')

  constructor() {
    if (browser) {
      const saved = localStorage.getItem('ui-state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          this.sidebarCollapsed = parsed.sidebarCollapsed ?? false
          this.theme = parsed.theme ?? 'system'
        } catch {
          // ignore corrupt state
        }
      }
    }

    $effect(() => {
      if (browser) {
        localStorage.setItem(
          'ui-state',
          JSON.stringify({
            sidebarCollapsed: this.sidebarCollapsed,
            theme: this.theme,
          }),
        )
      }
    })
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed
  }
}

export const uiState = new UIState()
