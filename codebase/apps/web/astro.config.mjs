// @ts-check
import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// output: 'server' + the Cloudflare adapter target the Workers runtime
// (ADR-006). Deployment itself is TASK-024; here the config only has to build.
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
