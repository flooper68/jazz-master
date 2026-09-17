import { useId, useState, type FormEvent } from 'react'
import { Button, Input } from '../../ui/Primitives'
import { joinWaitlist, type JoinWaitlist } from './joinWaitlist'

type Phase = 'idle' | 'sending' | 'joined' | 'failed'

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
          <Input tone="onAccent" id={emailId} name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </label>
        <label htmlFor={goalId} className="flex flex-col gap-1.5 text-[13px] font-semibold">
          What do you want to learn?
          <Input tone="onAccent" key={goal} id={goalId} name="goal" type="text" maxLength={500} defaultValue={goal} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Button type="submit" variant="onAccent" size="lg" disabled={phase === 'sending'}>
          {phase === 'sending' ? 'Joining' : 'Join the beta'}
        </Button>
        {phase === 'failed' && (
          <p role="alert" className="text-[15px] font-medium">
            That did not save. Try again in a moment.
          </p>
        )}
      </div>
    </form>
  )
}
