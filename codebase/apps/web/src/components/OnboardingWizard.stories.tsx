import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { OnboardingWizard } from './OnboardingWizard'
const meta = { title: 'Pages/Onboarding', component: OnboardingWizard,
  parameters: { layout: 'fullscreen' }, args: { onComplete: fn() },
} satisfies Meta<typeof OnboardingWizard>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Saving: Story = { args: { isSaving: true } }
