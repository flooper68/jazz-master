import { useId } from 'react'
import type { SessionPlan } from '../appData/quickRun'
import { PlayIcon } from './icons'

/**
 * What to practise now, and why. The plan is the scheduler's — a routine named
 * as next, or the session worked out from the run history — and every slot
 * carries the reason it is there, in the scheduler's own words. Until the runs
 * are in, the card says it is still working it out rather than offering a plan
 * that knows nothing.
 */
interface NextSessionCardProps {
  plan: SessionPlan
  onStart: () => void
  /** The runs have not arrived, so this plan is not the real answer yet. */
  pending?: boolean
  /** The runs could not be read; the plan stands but knows nothing of the history. */
  failed?: boolean
}

export function NextSessionCard({ plan, onStart, pending = false, failed = false }: NextSessionCardProps) {
  const headingId = useId()
  const count = plan.slots.length
  const waiting = pending && plan.routine === null
  return (
    <section className="rounded-2xl bg-accent p-4 text-on-accent lg:col-span-1" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-bold tracking-tight">
        {plan.routine ? `Next: ${plan.routine.name}` : 'Next session'}
      </h2>
      <p className="mt-1 text-sm opacity-90">
        {waiting
          ? 'Working out what to practise…'
          : count === 0
            ? 'Nothing to practise yet — add an exercise and it shows up here.'
            : plan.routine
              ? `${count} ${count === 1 ? 'exercise' : 'exercises'}, in the order you prepared them.`
              : failed
                ? `${count} ${count === 1 ? 'exercise' : 'exercises'} — your runs could not be read, so this is a fresh start rather than your plan.`
                : `${count} ${count === 1 ? 'exercise' : 'exercises'}, put together from what you have played.`}
      </p>
      {count > 0 && !waiting && (
        <ol className="mt-3 space-y-2">
          {plan.slots.map((slot) => (
            <li key={slot.exercise.id} className="rounded-xl bg-on-accent/10 px-3 py-2">
              <p className="truncate text-sm font-semibold">{slot.exercise.title}</p>
              <p className="mt-0.5 text-xs opacity-90">{slot.reason}</p>
            </li>
          ))}
        </ol>
      )}
      <button
        type="button"
        onClick={onStart}
        disabled={count === 0 || waiting}
        className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-on-accent px-3 py-1.5 text-sm font-semibold text-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
      >
        <PlayIcon />
        Play
      </button>
    </section>
  )
}
