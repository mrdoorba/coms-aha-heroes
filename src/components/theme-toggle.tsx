import { Moon, Sun } from 'lucide-react'
import { useTheme } from '~/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-[#325FEC]/8 hover:text-[#325FEC] transition-colors"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  )
}
