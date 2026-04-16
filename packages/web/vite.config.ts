import { paraglide } from '@inlang/paraglide-sveltekit/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    paraglide({
      project: '../../project.inlang',
      outdir: './src/lib/paraglide',
    }),
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: 'prompt',
      manifest: false,
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
