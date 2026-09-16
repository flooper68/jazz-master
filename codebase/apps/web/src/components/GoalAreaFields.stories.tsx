import type { ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { GoalAreaFields } from './ProfileFields'
import { profile } from '../stories/fixtures'
function InteractiveFields() {
  const [args, updateArgs] = useArgs<ComponentProps<typeof GoalAreaFields>>()
  return <GoalAreaFields {...args} onChange={(value) => {
    args.onChange(value)
    updateArgs({ goalAreas: value })
  }} />
}
const meta = { title: 'Components/GoalAreaFields', component: GoalAreaFields,
  args: { goalAreas: profile.goalAreas, onChange: fn() }, render: InteractiveFields,
} satisfies Meta<typeof GoalAreaFields>
export default meta
export const Interactive: StoryObj<typeof meta> = {}
