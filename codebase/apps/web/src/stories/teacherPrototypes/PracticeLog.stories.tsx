import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Bubble, QUIET, Shell } from './Chrome'
import { LOG, type MockLogEntry } from './mock'

/**
 * Practice log — a page of its own (owner decision 2026-09-20).
 *
 * Everything the teacher knows about the player, editable by the player; then
 * the log of conversations as cards, each summarising a *period* — the focus,
 * what was learned, what changed — and opening to the conversation behind it.
 */

/** The bio as fields rather than one blob, so a player can correct one thing. */
const ABOUT: [string, string][] = [
  ['Wants to', 'Solo over a ii–V–I in F, and comp standards behind a singer.'],
  ['Can already play', 'Open and barre chords; the minor pentatonic in two boxes; one major scale shape; the m7 and 7 arpeggio shapes.'],
  ['Working on', 'The maj7 shape — the sixth-string stretch. Autumn Leaves, as shell voicings.'],
  ['Enjoys', 'Autumn Leaves. Anything that sounds like a tune.'],
  ['Bored by', 'Spider exercises. Tremolo drills.'],
  ['Practises', 'Ten minutes at a time, several times a day, on the sofa. Comfortable to about 80 BPM on anything new.'],
]

const KIND: Record<MockLogEntry['kind'], string> = {
  onboarding: 'First lesson',
  after_session: 'After a session',
  on_demand: 'You asked',
  check_in: 'Check-in',
}

function PracticeLog({ opened = 0 }: { opened?: number | null }) {
  const [open, setOpen] = useState<number | null>(opened)
  const [editing, setEditing] = useState<number | null>(null)
  return (
    <Shell current="Practice log">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight">Practice log</h1>
        <p className="mt-1 text-sm text-fg-2">Who you are to the teacher — correct anything — and every conversation you have had, by period.</p>

        <section className="mt-6 rounded-2xl border border-line bg-panel p-5" aria-labelledby="about">
          <h2 id="about" className="font-display text-base font-semibold tracking-tight">About you</h2>
          <p className="mt-0.5 text-xs text-muted">Written by the teacher from what you told it and what you played. Where it disagrees with your practice, the practice wins.</p>
          <dl className="mt-4 divide-y divide-line">
            {ABOUT.map(([label, value], index) => (
              <div key={label} className="flex items-start gap-4 py-2.5">
                <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
                <dd className="min-w-0 flex-1 text-sm leading-relaxed text-fg">
                  {editing === index ? (
                    <span className="block rounded-lg border border-accent bg-canvas px-2.5 py-1.5">{value}<span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" /></span>
                  ) : (
                    value
                  )}
                </dd>
                <button type="button" onClick={() => setEditing(editing === index ? null : index)} className={QUIET}>
                  {editing === index ? 'Save' : 'Edit'}
                </button>
              </div>
            ))}
          </dl>
        </section>

        <h2 className="mt-8 font-display text-base font-semibold tracking-tight">Conversations</h2>
        <ol className="mt-3 space-y-4">
          {LOG.map((entry, index) => (
            <li key={entry.period} className={`rounded-2xl border bg-panel p-5 ${open === index ? 'border-accent/60' : 'border-line'}`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">
                  {entry.period.split(' · ')[0]} · {KIND[entry.kind]}
                </p>
                {entry.changed && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text">changed the path</span>}
              </div>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[6rem_1fr]">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted sm:pt-0.5">Focus</dt>
                <dd className="text-fg">{entry.focus}</dd>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted sm:pt-0.5">Learned</dt>
                <dd className="text-fg">{entry.learned}</dd>
                {entry.changed && (
                  <>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted sm:pt-0.5">Changed</dt>
                    <dd className="text-fg-2">{entry.changed}</dd>
                  </>
                )}
              </dl>
              <button type="button" onClick={() => setOpen(open === index ? null : index)} className={`mt-3 ${QUIET}`}>
                {open === index ? 'Hide the conversation' : 'Show the conversation'}
              </button>
              {open === index && (
                <ol className="mt-4 space-y-3 border-t border-line pt-4" aria-label="The conversation">
                  {(entry.conversation ?? []).map((line, at) => (
                    <Bubble key={at} line={line} />
                  ))}
                  {!entry.conversation && <li className="text-sm text-muted">The conversation from this period.</li>}
                </ol>
              )}
            </li>
          ))}
        </ol>
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
          'A page of its own: what the teacher knows about you, as fields you can correct; then every conversation as a card summarising its period — the focus, what you learned, what changed — with the conversation itself behind “Show”.',
      },
    },
  },
  args: { opened: 0 },
  argTypes: { opened: { control: { type: 'number', min: 0, max: 2 }, description: 'Which entry starts open (0 is today).' } },
} satisfies Meta<typeof PracticeLog>
export default meta
type Story = StoryObj<typeof meta>

export const TodayOpen: Story = {}
export const AllClosed: Story = { args: { opened: null } }
