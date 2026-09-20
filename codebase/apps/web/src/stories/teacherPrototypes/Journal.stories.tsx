import type { Meta, StoryObj } from '@storybook/react-vite'
import { Conversation, REPLAY, SayIt, Shell, StageChips } from './Chrome'
import { BIO, CHECK_IN, GOAL, GOAL_AFTER, LOG, useScript } from './mock'

const KIND: Record<string, string> = {
  onboarding: 'First lesson',
  after_session: 'After a session',
  on_demand: 'You asked',
  check_in: 'Check-in',
}

/**
 * Prototype 3 — **Journal**, memory first.
 *
 * The screen is the record: who you are to the teacher (the bio, and you can
 * correct it), then every conversation as an entry, newest at the top. Today's
 * entry is being written in front of you — the chat *is* the entry. The path
 * is a line at the top of each entry that changed it.
 */
function Journal({ speed = 1 }: { speed?: number }) {
  const script = useScript(CHECK_IN, { speed })
  const goal = script.pathRewritten ? GOAL_AFTER : GOAL
  return (
    <Shell current="Journal">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Journal</h1>
            <p className="mt-1 text-sm text-fg-2">What your teacher knows, and every conversation you have had.</p>
          </div>
          <button type="button" onClick={script.replay} className={REPLAY}>
            Replay
          </button>
        </div>

        <section className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold tracking-tight">Who you are, as far as it knows</h2>
            <button type="button" className="text-xs text-muted underline-offset-4 hover:underline">
              Correct this
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-fg-2">{BIO}</p>
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-[11px] uppercase tracking-wide text-muted">Working toward</p>
            <p className="mt-1 text-sm font-medium">{goal.title}</p>
            <div className="mt-2">
              <StageChips goal={goal} changedIndex={script.pathRewritten ? 1 : null} />
            </div>
          </div>
        </section>

        <ol className="mt-8 space-y-6">
          <li className="relative rounded-2xl border-2 border-accent/60 bg-panel p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[11px] uppercase tracking-wide text-accent-text">Today · Check-in · being written</p>
              {script.pathRewritten && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-fg">changed the path</span>}
            </div>
            <div className="mt-3">
              <Conversation script={script} exchanges={CHECK_IN} />
            </div>
            <SayIt placeholder="Say something" />
          </li>

          {LOG.slice(1).map((entry) => (
            <li key={entry.when} className="rounded-2xl border border-line bg-panel p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  {entry.when} · {KIND[entry.kind]}
                </p>
                {entry.changedPath && <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[11px] text-muted">changed the path</span>}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg-2">{entry.summary}</p>
              <button type="button" className="mt-2 text-xs text-muted underline-offset-4 hover:underline">
                Read the conversation
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Shell>
  )
}

const meta = {
  title: 'Prototypes/3 Journal — memory first',
  component: Journal,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The screen is the record: the bio at the top, correctable, then every conversation as an entry, newest first. Today’s entry is being written in front of you — the chat is the entry. The path is a line on each entry that changed it. Name on trial: **Journal**.',
      },
    },
  },
  args: { speed: 1 },
  argTypes: { speed: { control: { type: 'range', min: 0.5, max: 3, step: 0.5 } } },
} satisfies Meta<typeof Journal>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
