import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Conversation, REPLAY, SayIt, Shell, SolidityBar } from './Chrome'
import { CHECK_IN, GOAL, GOAL_AFTER, useScript } from './mock'

/**
 * Prototype 2 — **Path**, path first.
 *
 * The screen is the journey: stages stacked as a map, each with its solidity,
 * what is in it, and whether it is open. The teacher is a button on the path
 * that opens a drawer — you ask, it changes the map under you, you close it and
 * carry on. The conversation is a tool here, not the room.
 */
function PathFirst({ speed = 1 }: { speed?: number }) {
  const script = useScript(CHECK_IN, { speed })
  const [open, setOpen] = useState(false)
  const goal = script.pathRewritten ? GOAL_AFTER : GOAL
  // The drawer opens itself once the teacher starts talking, so a recording shows the whole shape.
  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(true), 1800 / speed)
    return () => window.clearTimeout(timer)
  }, [speed])

  return (
    <Shell current="Path">
      <div className="relative mx-auto max-w-3xl">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{goal.title}</h1>
            <p className="mt-1 text-sm text-fg-2">Four stages. Each opens once the one before it is mostly solid.</p>
          </div>
          <button type="button" onClick={script.replay} className={REPLAY}>
            Replay
          </button>
        </div>

        <ol className="relative mt-8 space-y-4 border-l-2 border-line pl-6">
          {goal.stages.map((stage, index) => (
            <li key={stage.title} className="relative">
              <span
                className={`absolute -left-[2.05rem] top-4 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                  stage.open ? 'border-accent bg-accent text-accent-fg' : 'border-line bg-canvas text-muted'
                }`}
              >
                {index + 1}
              </span>
              <div
                className={`rounded-2xl border p-4 transition-all duration-700 ${
                  script.pathRewritten && index === 1 ? 'border-accent bg-accent-soft/30' : stage.open ? 'border-line bg-panel' : 'border-dashed border-line bg-canvas opacity-70'
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-base font-semibold tracking-tight">{stage.title}</h2>
                  <span className="text-xs tabular-nums text-muted">{stage.open ? `${Math.round(stage.solidity * 100)}% solid` : 'locked'}</span>
                </div>
                <div className="mt-2">
                  <SolidityBar value={stage.solidity} open={stage.open} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {stage.items.map((item) => (
                    <li key={item.title} className={`flex items-center justify-between gap-3 text-sm ${item.title.startsWith('Autumn') ? 'font-medium text-accent-text' : ''}`}>
                      <span className="truncate">{item.title}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted">
                        {item.best === null ? 'new' : item.best >= item.target ? 'solid' : `${item.best} of ${item.target}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg shadow-lg"
          >
            Ask the teacher
          </button>
        )}

        {open && (
          <div className="fixed inset-y-0 right-0 z-10 flex w-full max-w-md flex-col border-l border-line bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight">The teacher</h2>
                <p className="text-xs text-muted">Changes the path as you talk.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className={REPLAY}>
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <Conversation script={script} exchanges={CHECK_IN} />
            </div>
            <div className="border-t border-line px-5 py-3">
              <SayIt placeholder="Ask, or tell it how it went" compact />
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}

const meta = {
  title: 'Prototypes/2 Path — path first',
  component: PathFirst,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The screen is the journey — stages as a map with solidity and what is in them. The teacher is a button on it that opens a drawer; you ask, the map changes under you, you close it. Conversation as a tool, not a room. Name on trial: **Path**.',
      },
    },
  },
  args: { speed: 1 },
  argTypes: { speed: { control: { type: 'range', min: 0.5, max: 3, step: 0.5 } } },
} satisfies Meta<typeof PathFirst>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
