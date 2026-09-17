import type { Meta, StoryObj } from '@storybook/react-vite'
import { LandingDownbeat } from './downbeat'
import { LandingFourBeats, LandingGiantCount, LandingManifesto, LandingOneScreen, LandingAskPlanPlay } from './landings'
const meta = { title: 'Variants/Count-in landing',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Six prototype landing pages for the Count-in direction (night and bone, one amber beat; Space Grotesk, Inter, JetBrains Mono). Each shows the same two live moments: ask for something and watch an AI build the plan, then four clicks and the real tab with its cursor. Guitar in any style, for a broad audience. Tokens are scoped to the prototypes; use the Theme toolbar for night and white.' } } },
} satisfies Meta
export default meta
type Story = StoryObj<typeof meta>
export const OneScreen: Story = { name: '1 · One screen', render: () => <LandingOneScreen /> }
export const FourBeats: Story = { name: '2 · Four beats', render: () => <LandingFourBeats /> }
export const Manifesto: Story = { name: '3 · Manifesto', render: () => <LandingManifesto /> }
export const GiantCount: Story = { name: '4 · Giant count', render: () => <LandingGiantCount /> }
export const AskPlanPlay: Story = { name: '5 · Ask, plan, play', render: () => <LandingAskPlanPlay /> }
export const Downbeat: Story = { name: '6 · Downbeat', render: () => <LandingDownbeat /> }
