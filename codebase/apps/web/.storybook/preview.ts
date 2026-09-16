import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
import './preview.css'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    viewport: {
      options: {
        mobile: { name: 'Mobile', styles: { width: '390px', height: '844px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },
    options: { storySort: { order: ['Pages', 'Primitives', 'Components', 'Public'] } },
  },
}
export default preview
