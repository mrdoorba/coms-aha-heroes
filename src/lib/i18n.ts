export { getLocale, setLocale, locales, baseLocale } from '~/paraglide/runtime.js'
export { m } from '~/paraglide/messages.js'

export type Locale = 'id' | 'en' | 'th'

export const localeLabels: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
  th: 'TH',
}
