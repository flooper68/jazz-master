import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Conversation, REPLAY, SayIt, Shell } from './Chrome'
import { CHECK_IN, FIRST_LESSON, GOAL, GOAL_AFTER, useScript, type Exchange } from './mock'

/**
 * Prototype 4 — **Coach**, on the home screen, on a phone.
 *
 * No separate screen at all. Home is today's session and, above it, the coach:
 * the stage you are on and one line about it. Tapping it slides the
 * conversation up over home; the path is a strip you can scroll. This is
 * "prominent on the home page" taken to its end — the teacher is where you
 * already are.
 */
function CoachHome({ speed = 1, firstLesson = false }: { speed?: number; firstLesson?: boolean }) {
  const exchanges: Exchange[] = firstLesson ? FIRST_LESSON : CHECK_IN
  const script = useScript(exchanges, { speed })
  const [sheet, setSheet] = useState(false)
  const goal = script.pathRewritten ? GOAL_AFTER : GOAL
  const stage = goal.stages[1]
  useEffect(() => {
    const timer = window.setTimeout(() => setSheet(true), 1600 / speed)
    return () => window.clearTimeout(timer)
  }, [speed])

  return (
    <div className="flex min-h-screen items-start justify-center bg-panel-2 py-8">
      <div className="relative">
        <Shell current="Home" phone>
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-xl font-bold tracking-tight">Home</h1>
            <button type="button" onClick={script.replay} className={REPLAY}>
              Replay
            </button>
          </div>
          <p className="mt-0.5 text-xs text-fg-2">Sunday · 2 runs · 11 min</p>

          {/* The coach: the stage you are on, one line, and the way in. */}
          <button
            type="button"
            onClick={() => setSheet(true)}
            className={`mt-4 w-full rounded-2xl border p-4 text-left transition-colors duration-700 ${script.pathRewritten ? 'border-accent bg-accent-soft/40' : 'border-accent/40 bg-accent-soft/20'}`}
          >
            <p className="text-[11px] uppercase tracking-wide text-accent-text">{firstLesson ? 'Your coach' : 'Your coach · stage 2 of 4'}</p>
            <p className="mt-1 font-display text-base font-semibold tracking-tight">{firstLesson ? 'No path yet — say what you want to play' : stage.title}</p>
            <p className="mt-1 text-xs text-fg-2">
              {firstLesson
                ? 'Four questions, a quick play, and you have a path.'
                : script.pathRewritten
                  ? 'Autumn Leaves added at 96 — plays as soon as the arpeggio line lands once more.'
                  : 'The C7 got through at 72 three days running. The maj7 is sitting at 64.'}
            </p>
            <span className="mt-3 inline-block rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg">Talk</span>
          </button>

          {!firstLesson && (
            <ol className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Stages">
              {goal.stages.map((item, index) => (
                <li key={item.title} className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium ${item.open ? 'bg-accent-soft text-accent-text' : 'bg-panel text-muted'} ${script.pathRewritten && index === 1 ? 'ring-2 ring-accent' : ''}`}>
                  {index + 1} · {item.open ? `${Math.round(item.solidity * 100)}%` : 'locked'}
                </li>
              ))}
            </ol>
          )}

          <div className="mt-4 rounded-2xl bg-accent p-4 text-accent-fg">
            <p className="font-display text-base font-semibold">Next session</p>
            <p className="mt-0.5 text-xs opacity-90">6 exercises · about 11 min</p>
            <div className="mt-3 flex gap-1.5 text-[11px]">
              {['5', '10', '20', '40'].map((minutes) => (
                <span key={minutes} className={`rounded-md px-2 py-1 ${minutes === '10' ? 'bg-fg text-canvas' : 'bg-accent-fg/15'}`}>
                  {minutes} min
                </span>
              ))}
            </div>
            <span className="mt-3 inline-block rounded-xl bg-fg px-4 py-2 text-sm font-semibold text-canvas">▶ Play</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ['This week', '11 min'],
              ['Streak', '1 day'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-panel p-3">
                <p className="text-[11px] text-muted">{label}</p>
                <p className="font-display text-lg font-bold">{value}</p>
              </div>
            ))}
          </div>
        </Shell>

        {sheet && (
          <div className="absolute inset-x-2 bottom-2 top-24 flex flex-col rounded-[1.8rem] border border-line bg-panel shadow-2xl" style={{ width: 374 }}>
            <div className="flex items-center justify-between px-5 pb-3 pt-4">
              <div>
                <p className="font-display text-base font-semibold tracking-tight">Your coach</p>
                <p className="text-[11px] text-muted">{firstLesson ? 'First lesson' : 'A check-in · it has read your practice'}</p>
              </div>
              <button type="button" onClick={() => setSheet(false)} className={REPLAY}>
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <Conversation script={script} exchanges={exchanges} />
            </div>
            <div className="px-4 pb-4 pt-2">
              <SayIt placeholder="Say something" compact />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const meta = {
  title: 'Prototypes/4 Coach — on the home screen',
  component: CoachHome,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'No separate screen. Home is today’s session and, above it, the coach: the stage you are on and one line about it. Tapping it slides the conversation up over home; the path is a strip. “Prominent on the home page” taken to its end. Name on trial: **Coach**.',
      },
    },
  },
  args: { speed: 1, firstLesson: false },
  argTypes: {
    speed: { control: { type: 'range', min: 0.5, max: 3, step: 0.5 } },
    firstLesson: { control: 'boolean', description: 'Play the first lesson instead of a check-in.' },
  },
} satisfies Meta<typeof CoachHome>
export default meta
type Story = StoryObj<typeof meta>

export const CheckIn: Story = {}
export const FirstLesson: Story = { args: { firstLesson: true } }
