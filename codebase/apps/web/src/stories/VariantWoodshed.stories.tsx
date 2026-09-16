import type { Meta, StoryObj } from '@storybook/react-vite'
import { PublicPreview } from './PublicPreview'
const meta = { title: 'Variants/Woodshed', component: PublicPreview,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Chosen public-page direction under the working code name "Woodshed": off-white, bold tight grotesk headlines (Inter Tight + Inter), black pill CTAs, floating pastel shapes and tilted colour cards, with "smart & easy personal practice" messaging. Light is the default; dark follows prefers-color-scheme on the real pages, these previews pin a theme. Rendered from the real Astro components under src/components/public/variants/woodshed.' } } },
  args: { name: 'landing-woodshed', title: 'Woodshed landing preview' },
} satisfies Meta<typeof PublicPreview>
export default meta
export const Landing: StoryObj<typeof meta> = {}
export const LandingDark: StoryObj<typeof meta> = { args: { name: 'landing-woodshed-dark', title: 'Woodshed landing preview (dark)' } }
export const SignUp: StoryObj<typeof meta> = { args: { name: 'sign-up-woodshed', title: 'Woodshed sign-up preview' } }
export const SignUpDark: StoryObj<typeof meta> = { args: { name: 'sign-up-woodshed-dark', title: 'Woodshed sign-up preview (dark)' } }
export const SignIn: StoryObj<typeof meta> = { args: { name: 'sign-in-woodshed', title: 'Woodshed sign-in preview' } }
export const SignInDark: StoryObj<typeof meta> = { args: { name: 'sign-in-woodshed-dark', title: 'Woodshed sign-in preview (dark)' } }
