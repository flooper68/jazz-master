import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Lockup, Mark, Wordmark } from '../components/Brand'

/**
 * The Count-in brand, as a living page: what the name means, the mark and
 * its variants, the amber rule, type, and the voice. The tokens themselves
 * are in Foundations / Theme.
 */

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-xs tracking-[0.14em] text-accent-text uppercase">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Tile({ children, caption, className = 'bg-canvas' }: { children: ReactNode; caption: string; className?: string }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className={`flex min-h-36 items-center justify-center rounded-xl border border-line p-6 ${className}`}>{children}</div>
      <figcaption className="text-[13px] leading-snug text-muted">{caption}</figcaption>
    </figure>
  )
}

const AMBER_IS = ['The current count, the cursor on the note, the exercise being played.', 'Today in a streak; the next step waiting on the home screen.', 'The one primary action of a view: Count me in, Take it again.']
const AMBER_IS_NOT = ['Links, icons, headings, borders, charts or decoration.', 'Success. Done is green; amber is now.', 'Two buttons in one view. The second action is bone, ink or a ghost.']

const VOICE: readonly [string, string, string][] = [
  ['Home, step ready', 'Your next step is ready. Twelve minutes.', 'Welcome back! Ready to crush your goals?'],
  ['Start', 'Count me in', 'Begin practice session'],
  ['Repeat an exercise', 'Take it again.', 'Would you like to retry?'],
  ['Session finished', "That's the set. Eleven nights running.", "Amazing work! You're on fire!"],
  ['Missed a day', 'The band waited. Pick it up tonight.', 'You broke your streak.'],
  ['Error', 'Lost the connection. Your last take is saved.', 'Oops! Something went wrong.'],
]

function BrandPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-16 py-6">
      <header className="space-y-5">
        <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Foundations</p>
        <Lockup className="text-6xl" />
        <p className="font-display text-2xl font-medium tracking-[-0.02em] text-fg-2">Practice smart.</p>
        <p className="max-w-2xl text-lg leading-relaxed text-fg-2">
          Count-in is frictionless music practice, powered by AI: describe your goal, get a plan made for you, and always practice the right thing, five minutes
          at a time. Guitar first, any style, any level. A count-in is the four clicks before the band comes in. It is the last thing we do for you: everything
          before the downbeat is ours, everything after it is yours. Closing line: <em>We count you in. You play.</em>
        </p>
      </header>

      <Section eyebrow="The mark" title="Three counts swell into the downbeat">
        <p className="max-w-2xl text-fg-2">
          Radii 2.5 / 3.5 / 4.5 / 9 on a 64-unit grid, centres at 8, 20, 34 and 52: every dot is a multiple of the first, and the gaps widen with the dots so the
          row reads as motion toward the downbeat. The first three dots take the text colour; the last is always amber. Keep one downbeat dot of clear space on
          every side. Below 12px tall, use the favicon form.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tile caption="Primary lockup. App shell, public header, social.">
            <Lockup className="text-4xl" />
          </Tile>
          <Tile caption="Mark only. Loading, empty states, the practice stage.">
            <Mark className="h-12 w-[7.25rem]" />
          </Tile>
          <Tile caption="Wordmark only. The amber hyphen is the beat when the mark is already nearby.">
            <span className="font-display text-4xl font-semibold tracking-[-0.035em]">
              <Wordmark />
            </span>
          </Tile>
          <Tile caption="Integrated. The mark takes the hyphen's seat; headlines only, never small.">
            <span className="flex items-center gap-[0.14em] font-display text-4xl font-semibold tracking-[-0.035em]">
              count
              <Mark className="mt-[0.12em] h-[0.5em] w-[1.21em]" />
              in
            </span>
          </Tile>
          <Tile caption="On amber. Everything turns ink; the size jump carries the idea." className="border-transparent bg-accent text-on-accent">
            <svg viewBox="4 20 58 24" className="h-10 w-[6.04rem]" aria-hidden="true">
              <circle cx="8" cy="32" r="2.5" className="fill-current" />
              <circle cx="20" cy="32" r="3.5" className="fill-current" />
              <circle cx="34" cy="32" r="4.5" className="fill-current" />
              <circle cx="52" cy="32" r="9" className="fill-current" />
            </svg>
          </Tile>
          <Tile caption="Favicon form, 64 / 32 / 16. Four dots blur when small, so it keeps one count and the downbeat.">
            <div className="flex items-end gap-5">
              {[64, 32, 16].map((size) => (
                <svg key={size} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
                  <rect width="64" height="64" rx="14" fill="#0f0f14" />
                  <circle cx="17" cy="32" r="6" fill="#f4f2ee" />
                  <circle cx="41" cy="32" r="15" fill="#e69b4c" />
                </svg>
              ))}
            </div>
          </Tile>
        </div>
        <p className="max-w-2xl text-[15px] text-muted">
          Do not recolour the dots (amber is only ever the downbeat), equalise their sizes, reverse the order, stretch, outline, shadow or tilt the mark.
        </p>
      </Section>

      <Section eyebrow="Colour" title="Night, bone, and one amber beat">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Night', '#0f0f14'],
            ['Bone', '#f4f2ee'],
            ['The beat', '#e69b4c'],
            ['Paper', '#fbfaf8'],
            ['Ink on amber', '#2e1b08'],
            ['Amber text, light', '#9a5613'],
          ].map(([name, hex]) => (
            <div key={name} className="flex flex-col gap-2">
              <span className="h-16 rounded-xl border border-line" style={{ background: hex }} />
              <span className="text-[13px] font-semibold">{name}</span>
              <span className="font-mono text-xs text-muted">{hex}</span>
            </div>
          ))}
        </div>
        <p className="max-w-2xl text-fg-2">Amber means “this is live right now”. If everything is amber, nothing is on the beat.</p>
        <div className="grid gap-8 md:grid-cols-2">
          <ul className="space-y-2.5">
            {AMBER_IS.map((line) => (
              <li key={line} className="grid grid-cols-[auto_1fr] items-baseline gap-3 text-[15px] text-fg-2">
                <span className="size-2.5 rounded-full bg-accent" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          <ul className="space-y-2.5">
            {AMBER_IS_NOT.map((line) => (
              <li key={line} className="grid grid-cols-[auto_1fr] items-baseline gap-3 text-[15px] text-fg-2">
                <span className="size-2.5 rounded-full border border-line-strong" aria-hidden="true" />
                Not for: {line}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section eyebrow="Shape" title="Crisp, not soft">
        <p className="max-w-2xl text-fg-2">
          Corners are crisp: 4px on buttons and fields, 6px on cards, 8px at most. The only round things in Count-in are the beats: the dots of the mark, the cursor on the note, a day in a streak.
          Sharp interface, round beats; the contrast is the point.
        </p>
      </Section>

      <Section eyebrow="Type" title="Three faces, three jobs">
        <div className="divide-y divide-line border-y border-line">
          <div className="grid gap-2 py-5 md:grid-cols-[14rem_1fr]">
            <p className="text-[13px] text-muted">Display · Space Grotesk 600, tight tracking</p>
            <p className="font-display text-5xl leading-none font-semibold tracking-[-0.045em]">Practice smart.</p>
          </div>
          <div className="grid gap-2 py-5 md:grid-cols-[14rem_1fr]">
            <p className="text-[13px] text-muted">Interface and reading · Inter 400 / 500 / 600</p>
            <p className="max-w-[60ch] text-fg-2">Describe your goal. Get a plan made for you. Five minutes free? You’ll always practice the right thing.</p>
          </div>
          <div className="grid gap-2 py-5 md:grid-cols-[14rem_1fr]">
            <p className="text-[13px] text-muted">Numerals · JetBrains Mono 500, tabular. Counts, frets, bpm, timers, streaks.</p>
            <p className="font-mono text-4xl font-medium tabular-nums">
              1 2 3 <span className="text-accent">4</span> · 96 bpm · 12:40
            </p>
          </div>
        </div>
      </Section>

      <Section eyebrow="Voice" title="A calm bandleader">
        <p className="max-w-2xl text-fg-2">
          Short, certain, a little dry, in plain words a beginner understands. The app has already made the decisions, so it never asks you to. No exclamation
          marks and no cheerleading: praise adds the tension we are here to remove.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px]">
            <thead>
              <tr className="font-mono text-xs tracking-[0.1em] text-muted uppercase">
                <th className="py-2 pr-4 font-medium">Moment</th>
                <th className="py-2 pr-4 font-medium">Say</th>
                <th className="py-2 font-medium">Not</th>
              </tr>
            </thead>
            <tbody>
              {VOICE.map(([moment, say, not]) => (
                <tr key={moment} className="border-t border-line align-top">
                  <td className="py-3 pr-4 text-muted">{moment}</td>
                  <td className="py-3 pr-4 font-display font-medium">{say}</td>
                  <td className="py-3 text-muted line-through decoration-line-strong">{not}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section eyebrow="Motion" title="Everything moves in four">
        <p className="max-w-2xl text-fg-2">
          One animation, reused: dots land on their beat, then the downbeat. The landing page plays it at full size (the amber dot opens to fill the screen).
          Loading is the same four steps; progress through a session is one dot per exercise with the current one amber. Nothing bounces, and everything holds
          still under reduced motion.
        </p>
      </Section>
    </div>
  )
}

const meta = {
  title: 'Foundations/Brand',
  component: BrandPage,
  tags: ['!autodocs'],
  parameters: { layout: 'padded', docs: { description: { component: 'The Count-in brand: the name, the mark and its variants, the amber rule, shape, type, voice and motion. Light and dark via the toolbar.' } } },
} satisfies Meta<typeof BrandPage>
export default meta
export const Brand: StoryObj<typeof meta> = {}
