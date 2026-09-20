import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { AssistantTurn, PlayerTurn } from '../../components/chat/Chat'
import { Markdown } from '../../components/chat/Markdown'
import { QUIET, Shell } from './Chrome'
import { BIO, LOG, stepsOf, type MockLogEntry } from './mock'

/**
 * Practice log — a page of its own (owner decisions 2026-09-20).
 *
 * Left: the syncs — every conversation with the teacher as a card summarising
 * its period, one structured text in markdown, the conversation itself behind
 * it. Right: about you, one text the teacher keeps and you can correct.
 */

const KIND: Record<MockLogEntry['kind'], string> = {
  onboarding: 'First lesson',
  after_session: 'After a session',
  on_demand: 'You asked',
  check_in: 'Check-in',
}

function PracticeLog({ opened = 0 }: { opened?: number | null }) {
  const [open, setOpen] = useState<number | null>(opened)
  const [editing, setEditing] = useState(false)
  return (
    <Shell current="Practice log">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-2xl font-bold tracking-tight">Practice log</h1>
        <p className="mt-1 text-sm text-fg-2">Every sync with the teacher, by period — and who you are to it.</p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="min-w-0">
            <h2 className="font-display text-base font-semibold tracking-tight">Syncs</h2>
            <ol className="mt-3 space-y-4">
              {LOG.map((entry, index) => (
                <li key={entry.period} className={`rounded-2xl border bg-panel p-5 ${open === index ? 'border-accent/60' : 'border-line'}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      {entry.period.split(' · ')[0]} · {KIND[entry.kind]}
                    </p>
                    {entry.changedPath && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text">changed the path</span>}
                  </div>
                  <div className="mt-3">
                    <Markdown text={entry.summary} />
                  </div>
                  <button type="button" onClick={() => setOpen(open === index ? null : index)} className={`mt-3 ${QUIET}`}>
                    {open === index ? 'Hide the conversation' : 'Show the conversation'}
                  </button>
                  {open === index && (
                    <div className="mt-4 space-y-4 border-t border-line pt-4">
                      {(entry.conversation ?? []).map((line, at) =>
                        line.who === 'you' ? <PlayerTurn key={at} text={line.text} /> : <AssistantTurn key={at} text={line.text} steps={stepsOf(line)} />,
                      )}
                      {!entry.conversation && <p className="text-sm text-muted">The conversation from this period.</p>}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <aside className="min-w-0">
            <section className="rounded-2xl border border-line bg-panel p-5" aria-labelledby="about">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="about" className="font-display text-base font-semibold tracking-tight">About you</h2>
                <button type="button" onClick={() => setEditing(!editing)} className={QUIET}>
                  {editing ? 'Save' : 'Edit'}
                </button>
              </div>
              <p className="mt-0.5 text-xs text-muted">The teacher keeps this from what you told it and what you played. Correct anything.</p>
              <div className={`mt-3 ${editing ? 'rounded-xl border border-accent bg-canvas p-3' : ''}`}>
                <Markdown text={BIO} />
                {editing && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" />}
              </div>
              <p className="mt-3 text-[11px] text-muted">Where this disagrees with your practice, the practice wins.</p>
            </section>
          </aside>
        </div>
      </div>
    </Shell>
  )
}

const meta = {
  title: 'Prototypes/Practice log',
  component: PracticeLog,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A page of its own. Left: the syncs — every conversation as a card summarising its period, one text in markdown, the conversation behind “Show”. Right: about you, one text you can correct. “Syncs” is the owner’s word, on trial as the heading.',
      },
    },
  },
  args: { opened: 0 },
  argTypes: { opened: { control: { type: 'number', min: 0, max: 2 }, description: 'Which sync starts open (0 is today).' } },
} satisfies Meta<typeof PracticeLog>
export default meta
type Story = StoryObj<typeof meta>

export const TodayOpen: Story = {}
export const AllClosed: Story = { args: { opened: null } }
