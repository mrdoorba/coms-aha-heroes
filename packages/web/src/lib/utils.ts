import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildSearchParams(
  updates: Record<string, string | null | undefined>,
  base?: URLSearchParams,
) {
  const params = new URLSearchParams(base)

  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '') params.delete(key)
    else params.set(key, value)
  }

  return params.toString()
}

// shadcn-svelte v3 helper types consumed by primitive components (button/card/badge/etc.)
export type WithoutChildren<T> = Omit<T, "children">
export type WithoutChild<T> = Omit<T, "child">
export type WithoutChildrenOrChild<T> = WithoutChild<WithoutChildren<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }
