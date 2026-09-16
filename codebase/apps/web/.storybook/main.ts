import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  core: { disableTelemetry: true },
  async viteFinal(config) {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    // The output sits inside public; never recursively copy it into itself.
    config.publicDir = false
    config.base = './'
    config.server = { ...config.server, proxy: { '/_storybook/previews': 'http://localhost:4321' } }
    config.resolve = {
      ...config.resolve,
      alias: {
        '@clerk/astro/react': fileURLToPath(new URL('../src/stories/ClerkPreview.tsx', import.meta.url)),
      },
    }
    return config
  },
}
export default config
