import { useId, useState, type FormEvent } from 'react'
import { joinWaitlist, type JoinWaitlist } from './joinWaitlist'

type Phase = 'idle' | 'sending' | 'joined' | 'failed'

const FIELD =
  'w-full rounded-md border border-on-accent/40 bg-transparent px-4 py-3.5 text-base text-on-accent placeholder:text-on-accent/55 focus-visible:border-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent'

/**
 * The beta waitlist, on the amber closing screen: an address, and (if they
 * like) what they want to learn — offered already filled in with whatever
 * they asked the page for.
 */
export function WaitlistForm({ goal, onJoin = joinWaitlist }: { goal: string; onJoin?: JoinWaitlist }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const emailId = useId()
  const goalId = useId()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const wanted = String(data.get('goal') ?? '').trim()
    setPhase('sending')
    try {
      setPhase((await onJoin({ email, goal: wanted || undefined })) ? 'joined' : 'failed')
    } catch {
      setPhase('failed')
    }
  }

  if (phase === 'joined') {
    return (
      <p role="status" className="font-display text-2xl leading-snug font-semibold tracking-[-0.02em]">
        You're on the list. We'll count you in.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xl flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={emailId} className="flex flex-col gap-1.5 text-[13px] font-semibold">
          Email
          <input id={emailId} name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={FIELD} />
        </label>
        <label htmlFor={goalId} className="flex flex-col gap-1.5 text-[13px] font-semibold">
          What do you want to learn?
          <input key={goal} id={goalId} name="goal" type="text" maxLength={500} defaultValue={goal} className={FIELD} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <button
          type="submit"
          disabled={phase === 'sending'}
          className="inline-flex items-center gap-2 rounded-md bg-on-accent px-6 py-4 text-base leading-none font-semibold text-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent disabled:opacity-60"
        >
          {phase === 'sending' ? 'Joining' : 'Join the beta'}
        </button>
        {phase === 'failed' && (
          <p role="alert" className="text-[15px] font-medium">
            That did not save. Try again in a moment.
          </p>
        )}
      </div>
    </form>
  )
}
