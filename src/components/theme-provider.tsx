import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { setThemeFn } from '~/server/functions/theme'

type Theme = 'light' | 'dark'

interface ThemeContext {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContext | undefined>(undefined)

export function ThemeProvider({
  initial,
  children,
}: {
  initial: Theme
  children: ReactNode
}) {
  const [theme, setThemeState] = useState<Theme>(initial)

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    setThemeFn({ data: { theme: t } })
  }, [])

  return (
    <ThemeContext value={{ theme, setTheme }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
