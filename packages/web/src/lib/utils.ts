import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// shadcn-svelte v3 helper types consumed by primitive components (button/card/badge/etc.)
export type WithoutChildren<T> = Omit<T, "children">
export type WithoutChild<T> = Omit<T, "child">
export type WithoutChildrenOrChild<T> = WithoutChild<WithoutChildren<T>>
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null }
