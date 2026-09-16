import type { Meta, StoryObj } from '@storybook/react-vite'
import { PublicPreview } from './PublicPreview'
const meta = { title: 'Public/Header', component: PublicPreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Production Astro components rendered as static previews. Authentication previews show the real page shell with an inert Clerk form placeholder.' } } },
  args: { name: 'header', title: 'Header preview' },
} satisfies Meta<typeof PublicPreview>
export default meta
export const Default: StoryObj<typeof meta> = {}
