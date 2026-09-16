import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
import './preview.css'

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Woodshed color scheme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    // Tokens live on the nearest [data-theme]; wrapping every story lets the
    // toolbar switch schemes without touching the story's own markup.
    (Story, { globals }) => (
      <div data-theme={globals.theme} className="min-h-screen bg-canvas text-fg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    viewport: {
      options: {
        mobile: { name: 'Mobile', styles: { width: '390px', height: '844px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },
    options: { storySort: { order: ['Foundations', 'Pages', 'Primitives', 'Components', 'Public', 'Variants'] } },
  },
}
export default preview
