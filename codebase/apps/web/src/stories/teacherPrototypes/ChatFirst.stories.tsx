import type { Meta, StoryObj } from '@storybook/react-vite'
import { Conversation, SayIt, Shell, StageChips } from './Chrome'
import { CHECK_IN, GOALS, GOAL_AFTER, LOG, useScript } from './mock'

/**
 * The teacher's screen — chat first (the shape the owner chose, 2026-09-20).
 *
 * The conversation is the screen. On the right: the current goals, each with
 * its stages and rewritten in front of you as the teacher works, and the last
 * summary. Who the player is — the bio — lives on the Practice log page now,
 * not here.
 */
function Teacher({ speed = 1 }: { speed?: number }) {
  const script = useScript(CHECK_IN, { speed })
  const goals = script.pathRewritten ? [GOAL_AFTER, GOALS[1]] : GOALS
  return (
    <Shell current="Teacher">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-2xl font-bold tracking-tight">Teacher</h1>
        <p className="mt-1 text-sm text-fg-2">A check-in. It has read your practice already.</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="min-w-0">
            <Conversation script={script} exchanges={CHECK_IN} />
            <SayIt placeholder="How has it been going?" />
          </section>

          <aside className="min-w-0 space-y-5">
            <section>
              <h2 className="font-display text-base font-semibold tracking-tight">Current goals</h2>
              <ul className="mt-2 space-y-3">
                {goals.map((goal, index) => {
                  const touched = script.pathRewritten && index === 0
                  return (
                    <li key={goal.title} className={`rounded-2xl border p-4 transition-colors duration-700 ${touched ? 'border-accent bg-accent-soft/30' : 'border-line bg-panel'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-sm font-semibold tracking-tight">{goal.title}</h3>
                        {touched && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-fg">rewritten just now</span>}
                      </div>
                      <div className="mt-2.5">
                        <StageChips goal={goal} changedIndex={touched ? 1 : null} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-line bg-panel p-4">
              <h2 className="text-sm font-semibold">Last summary</h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted">{LOG[1].period}</p>
              <p className="mt-2 text-xs leading-relaxed text-fg-2">
                <span className="font-medium text-fg">Focus.</span> {LOG[1].focus}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-2">
                <span className="font-medium text-fg">Learned.</span> {LOG[1].learned}
              </p>
              <button type="button" className="mt-2 text-xs text-muted underline-offset-4 hover:underline">
                Practice log →
              </button>
            </section>
          </aside>
        </div>
      </div>
    </Shell>
  )
}

const meta = {
  title: 'Prototypes/Teacher — chat first',
  component: Teacher,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The chosen shape. The conversation is the screen; on the right the current goals, rewritten in front of you as the teacher works, and the last summary. The story plays a scripted check-in when opened; reload to watch it again. The speed control slows the typing.',
      },
    },
  },
  args: { speed: 1 },
  argTypes: { speed: { control: { type: 'range', min: 0.5, max: 3, step: 0.5 } } },
} satisfies Meta<typeof Teacher>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
