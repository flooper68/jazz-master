import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { LevelFields } from './ProfileFields'
import { profile } from '../stories/fixtures'
function InteractiveFields() {
  const [args, updateArgs] = useArgs<ComponentProps<typeof LevelFields>>()
  return <LevelFields {...args} onChange={(value) => {
    args.onChange(value)
    updateArgs({ levels: value })
  }} />
}
const meta = { title: 'Components/LevelFields', component: LevelFields,
  args: { levels: profile.levels, onChange: fn() }, render: InteractiveFields,
} satisfies Meta<typeof LevelFields>
export default meta
export const Interactive: StoryObj<typeof meta> = {}
