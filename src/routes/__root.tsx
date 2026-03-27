/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
  useRouter,
} from '@tanstack/react-router'
import { FileQuestion, AlertTriangle } from 'lucide-react'
import appCss from '~/styles/globals.css?url'
import { getLocale } from '~/paraglide/runtime.js'
import { Button, buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'AHA HEROES' },
      { name: 'theme-color', content: '#325FEC' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={getLocale()}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased">
        {children}
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js') }) }`,
          }}
        />
      </body>
    </html>
  )
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <FileQuestion className="mb-4 size-16 text-muted-foreground" />
        <p className="mb-2 text-6xl font-bold" style={{ color: '#1D388B' }}>
          404
        </p>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Page not found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/dashboard" className={cn(buttonVariants())}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

function ErrorPage({ error }: { error: Error }) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Something went wrong</h1>
        {error?.message && (
          <p className="mb-6 text-sm text-muted-foreground">{error.message}</p>
        )}
        <div className="flex gap-3">
          <Button onClick={() => router.invalidate()}>Try Again</Button>
          <Link to="/dashboard" className={cn(buttonVariants({ variant: 'outline' }))}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
