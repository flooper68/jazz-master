import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState } from 'react'
import { Conversation, Shell, StageChips } from './Chrome'
import { GOALS, useScript, type Exchange } from './mock'

/**
 * Home — the teacher on the left, the session to start and the goals it
 * serves on the right, no analytics (owner decisions 2026-09-20). The left
 * column is where the teacher's offers live — "how did that go?" after a
 * session, a check-in when due — and a quick word happens right there;
 * anything longer continues on the Teacher page.
 */

/** The short exchange a home strip is for: the after-session offer, answered. */
const QUICK: Exchange[] = [
  { who: 'teacher', doing: ['Reading your practice'], text: 'That was 11 minutes — the C7 got through at 72 again. How did it feel?' },
  { who: 'you', text: 'Better. Still slow on the maj7.' },
  {
    who: 'teacher',
    doing: ['Noting what it learned'],
    text: 'Noted. It’s at 64; I’ll leave the target where it is for two more days before we look at it. Nothing else to change today.',
  },
]

function HomeTeacher({ speed = 1, offer = 'after_session' }: { speed?: number; offer?: 'after_session' | 'check_in' | 'none' }) {
  const script = useScript(QUICK, { speed, autoplay: false })
  const [talking, setTalking] = useState(false)
  useEffect(() => {
    if (offer === 'none') return
    const timer = window.setTimeout(() => {
      setTalking(true)
      script.replay()
    }, 2400 / speed)
    return () => window.clearTimeout(timer)
    // The script object changes every render; the offer and speed are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer, speed])

  return (
    <Shell current="Home">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-2xl font-bold tracking-tight">Home</h1>
        <p className="mt-1 text-sm text-fg-2">Sunday, September 20 · 2 practice runs · 11 min</p>

        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Left: the teacher. Its offers live here, and a quick word happens here. */}
          <section className={`rounded-2xl border p-4 transition-colors duration-500 ${talking ? 'border-accent bg-accent-soft/30' : 'border-line bg-panel'}`}>
            {!talking ? (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-accent-text">{offer === 'check_in' ? 'A week has passed' : offer === 'none' ? 'The teacher' : 'After that session'}</p>
                <p className="mt-0.5 text-sm font-medium">
                  {offer === 'check_in' ? 'Want to check in on how the fortnight went?' : offer === 'none' ? 'Nothing to ask right now. Say something if you like.' : 'How did that go?'}
                </p>
                {offer !== 'none' && (
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-xl bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg">Talk</span>
                    <span className="rounded-xl border border-line px-3.5 py-2 text-sm text-fg-2">Not now</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-accent-text">After that session · a quick word</p>
                <Conversation script={script} exchanges={QUICK} placeholder="Anything else?" className="mt-3 h-[26rem]" />
                {script.done && (
                  <p className="mt-3 text-xs text-muted">
                    Written to your practice log. <span className="underline underline-offset-4">Continue with the teacher →</span>
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Right: the session to start, and the goals it serves. */}
          <div className="space-y-4">
            <section className="rounded-2xl bg-accent p-4 text-accent-fg">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold tracking-tight">Next session</h2>
                <span className="text-xs opacity-90">6 exercises · about 11 min</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                {['5', '10', '20', '40', '60'].map((minutes) => (
                  <span key={minutes} className={`rounded-md px-2 py-1 font-medium ${minutes === '20' ? 'bg-fg text-canvas' : 'bg-accent-fg/15'}`}>
                    {minutes}
                  </span>
                ))}
                <span className="ml-1 text-[11px] opacity-80">min</span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="rounded-xl bg-fg px-5 py-2 text-sm font-semibold text-canvas">▶ Play</span>
                <span className="text-sm underline underline-offset-4">What’s in it</span>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-base font-semibold tracking-tight">Current goals</h2>
                <span className="text-xs text-muted underline-offset-4 hover:underline">Teacher →</span>
              </div>
              <ul className="mt-3 space-y-3">
                {GOALS.map((goal) => (
                  <li key={goal.title}>
                    <p className="text-sm font-medium leading-snug">{goal.title}</p>
                    <div className="mt-1.5">
                      <StageChips goal={goal} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Shell>
  )
}

const meta = {
  title: 'Prototypes/Home — session first, goals beside',
  component: HomeTeacher,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The teacher on the left — its offers, and a quick word right there. On the right, the session to start and the goals it serves. No analytics. The story plays the after-session offer being taken.',
      },
    },
  },
  args: { speed: 1, offer: 'after_session' },
  argTypes: {
    speed: { control: { type: 'range', min: 0.5, max: 3, step: 0.5 } },
    offer: { control: 'radio', options: ['after_session', 'check_in', 'none'], description: 'Which offer the strip is making.' },
  },
} satisfies Meta<typeof HomeTeacher>
export default meta
type Story = StoryObj<typeof meta>

export const AfterASession: Story = {}
export const CheckInDue: Story = { args: { offer: 'check_in' } }
export const NoOffer: Story = { args: { offer: 'none' } }
