// @ts-check
import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'astro/config'

// output: 'server' + the Cloudflare adapter target the Workers runtime
// (ADR-006). Deployment itself is TASK-024; here the config only has to build.
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react()],
  vite: {
    plugins: [
      // TanStack Router codegen for the /app/* SPA island (TASK-022). Route
      // files live under src/app/routes so Astro keeps sole ownership of
      // src/pages. User vite plugins run before integration-injected ones,
      // which satisfies the router-plugin-before-react-plugin ordering rule.
      tanstackRouter({
        target: 'react',
        routesDirectory: 'src/app/routes',
        generatedRouteTree: 'src/app/routeTree.gen.ts',
        autoCodeSplitting: true,
      }),
      tailwindcss(),
    ],
  },
})
