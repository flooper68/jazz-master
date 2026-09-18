import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EVERYTHING, EXERCISES, filterExercises, type ExerciseQuery } from '../content'
import { ExerciseFilter } from './ExerciseFilter'

/** The filter over the whole pack, holding its own query, with the count it would show underneath. */
function Playground({ query: initial }: { query: ExerciseQuery }) {
  const [query, setQuery] = useState(initial)
  return (
    <div className="max-w-3xl">
      <ExerciseFilter exercises={EXERCISES} query={query} onChange={setQuery} />
      <p className="mt-3 text-sm text-muted">{filterExercises(EXERCISES, query).length} exercises</p>
    </div>
  )
}

const meta = {
  title: 'Components/ExerciseFilter',
  component: Playground,
  args: { query: EVERYTHING },
  parameters: { docs: { description: { component: 'Finding exercises: a search box and one select per category. Each option says how many exercises it would show; an option that would show none is not offered.' } } },
} satisfies Meta<typeof Playground>
export default meta
type Story = StoryObj<typeof meta>

export const Everything: Story = {}
export const Chords: Story = { args: { query: { ...EVERYTHING, areas: ['chords'], techniques: ['strumming'] } } }
export const AStyle: Story = { args: { query: { ...EVERYTHING, styles: ['jazz/bebop'], levels: [3] } } }
