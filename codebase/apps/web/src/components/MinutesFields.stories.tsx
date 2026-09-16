import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { MinutesFields } from './ProfileFields'
import { profile } from '../stories/fixtures'
function InteractiveFields() {
  const [args, updateArgs] = useArgs<ComponentProps<typeof MinutesFields>>()
  return <MinutesFields {...args} onChange={(value) => {
    args.onChange(value)
    updateArgs({ minutesPerDay: value })
  }} />
}
const meta = { title: 'Components/MinutesFields', component: MinutesFields,
  args: { minutesPerDay: profile.minutesPerDay, onChange: fn() }, render: InteractiveFields,
} satisfies Meta<typeof MinutesFields>
export default meta
export const Interactive: StoryObj<typeof meta> = {}
