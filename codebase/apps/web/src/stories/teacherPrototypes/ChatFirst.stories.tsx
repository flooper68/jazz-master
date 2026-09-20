import type { Meta, StoryObj } from '@storybook/react-vite'
import { Conversation, REPLAY, SayIt, Shell, StageChips } from './Chrome'
import { BIO, CHECK_IN, GOAL, GOAL_AFTER, LOG, useScript } from './mock'

/**
 * Prototype 1 — **Teacher**, chat first.
 *
 * The conversation is the screen. The path sits in a rail beside it and is
 * rewritten in front of you as the teacher works — the stage it touched lights
 * up. Underneath, what it knows about you and the last thing it wrote down.
 * This is the shipped screen pushed further: the rail reacts, and the memory is
 * visible.
 */
function ChatFirst({ speed = 1 }: { speed?: number }) {
  const script = useScript(CHECK_IN, { speed })
  const goal = script.pathRewritten ? GOAL_AFTER : GOAL
  return (
    <Shell current="Teacher">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Teacher</h1>
            <p className="mt-1 text-sm text-fg-2">A check-in. It has read your practice already.</p>
          </div>
          <button type="button" onClick={script.replay} className={REPLAY}>
            Replay
          </button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="min-w-0">
            <Conversation script={script} exchanges={CHECK_IN} />
            <SayIt placeholder="How has it been going?" />
          </section>

          <aside className="min-w-0 space-y-4">
            <div className={`rounded-2xl border p-4 transition-colors duration-700 ${script.pathRewritten ? 'border-accent bg-accent-soft/30' : 'border-line bg-panel'}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-base font-semibold tracking-tight">{goal.title}</h2>
                {script.pathRewritten && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-fg">rewritten just now</span>}
              </div>
              <div className="mt-3">
                <StageChips goal={goal} changedIndex={script.pathRewritten ? 1 : null} />
              </div>
              <ul className="mt-3 space-y-1 text-xs text-fg-2">
                {goal.stages[1].items.map((item) => (
                  <li key={item.title} className={`flex justify-between gap-3 ${item.best === null && script.pathRewritten && item.title.startsWith('Autumn') ? 'font-medium text-accent-text' : ''}`}>
                    <span className="truncate">{item.title}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {item.best ?? '—'} / {item.target}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-4">
              <h2 className="text-sm font-semibold">What it knows about you</h2>
              <p className="mt-1.5 line-clamp-4 text-xs leading-relaxed text-fg-2">{BIO}</p>
              <button type="button" className="mt-2 text-xs text-muted underline-offset-4 hover:underline">
                Read all · correct it
              </button>
            </div>

            <div className="rounded-2xl border border-line bg-panel p-4">
              <h2 className="text-sm font-semibold">Last time</h2>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">{LOG[1].when}</p>
              <p className="mt-1 text-xs leading-relaxed text-fg-2">{LOG[1].summary}</p>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  )
}

const meta = {
  title: 'Prototypes/1 Teacher — chat first',
  component: ChatFirst,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The conversation is the screen; the path is a rail that rewrites itself as the teacher works, and the memory — what it knows about you, what it wrote down last time — is visible beside it. The shipped screen, one step on. Name on trial: **Teacher**.',
      },
    },
  },
  args: { speed: 1 },
  argTypes: { speed: { control: { type: 'range', min: 0.5, max: 3, step: 0.5 } } },
} satisfies Meta<typeof ChatFirst>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
