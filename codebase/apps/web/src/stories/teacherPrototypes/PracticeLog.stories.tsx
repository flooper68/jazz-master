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

function SyncPage({ entry, back }: { entry: MockLogEntry; back: () => void }) {
  return (
    <Shell current="Practice log">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={back} className={`${QUIET} mb-4`}>
          ← Practice log
        </button>
        <p className="text-[11px] uppercase tracking-wide text-muted">
          {entry.period.split(' · ')[0]} · {KIND[entry.kind]}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{entry.period.split(' · ')[0] === 'Today' ? 'Today’s check-in' : 'The sync'}</h1>
        <section className="mt-5 rounded-2xl border border-line bg-panel p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold">Summary</h2>
            {entry.changedPath && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text">changed the path</span>}
          </div>
          <div className="mt-2">
            <Markdown text={entry.summary} />
          </div>
        </section>
        <h2 className="mt-8 font-display text-base font-semibold tracking-tight">The conversation</h2>
        <div className="mt-3 space-y-5">
          {(entry.conversation ?? []).map((line, at) =>
            line.who === 'you' ? <PlayerTurn key={at} text={line.text} /> : <AssistantTurn key={at} text={line.text} steps={stepsOf(line)} />,
          )}
          {!entry.conversation && <p className="text-sm text-muted">The conversation from this period.</p>}
        </div>
      </div>
    </Shell>
  )
}

function PracticeLog({ opened = null }: { opened?: number | null }) {
  const [page, setPage] = useState<number | null>(opened)
  const [editing, setEditing] = useState(false)
  if (page !== null) return <SyncPage entry={LOG[page]} back={() => setPage(null)} />
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
                <li key={entry.period} className="rounded-2xl border border-line bg-panel p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      {entry.period.split(' · ')[0]} · {KIND[entry.kind]}
                    </p>
                    {entry.changedPath && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text">changed the path</span>}
                  </div>
                  <div className="mt-3">
                    <Markdown text={entry.summary} />
                  </div>
                  <button type="button" onClick={() => setPage(index)} className={`mt-3 ${QUIET}`}>
                    Open the conversation →
                  </button>
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
          'A page of its own. Left: the syncs — every conversation as a card summarising its period, one text in markdown; the conversation opens as its own page. Right: about you, one text you can correct. “Syncs” is the owner’s word, on trial as the heading.',
      },
    },
  },
  args: { opened: null },
  argTypes: { opened: { control: { type: 'number', min: 0, max: 2 }, description: 'Start on a sync’s page instead of the log (0 is today).' } },
} satisfies Meta<typeof PracticeLog>
export default meta
type Story = StoryObj<typeof meta>

export const TheLog: Story = {}
export const TodaysSync: Story = { args: { opened: 0 } }
