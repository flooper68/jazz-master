import { useEffect, useId, useRef, useState } from 'react'
import { formatDuration } from '../appData/dashboard'
import { SESSION_MINUTES, type SessionPlan } from '../appData/quickRun'
import { exerciseSeconds, homeLabel, type Exercise } from '../content'
import { AREA_BADGE, AREA_LABELS } from './areaLabels'
import { ExerciseThumb } from './ExerciseThumb'
import { keyLabel } from './facetLabels'
import { CloseIcon, InfoIcon, PlayIcon } from './icons'
import { Button } from './ui/Primitives'

/**
 * What to practise now. The card is the answer and one Play — how much there
 * is, and nothing else to read before starting. The plan itself (which
 * exercises, what each one is, and the scheduler's reason for putting it
 * there) is a press away, for when the answer is worth questioning rather
 * than taken. The controls sit at the foot of the card, on the line they share
 * with whatever stands beside it.
 *
 * Until the runs are in, the card says it is still working it out rather than
 * offering a plan that knows nothing.
 */
interface NextSessionCardProps {
  plan: SessionPlan
  onStart: () => void
  /** How long the session should be, and the user changing their mind about it. */
  minutes: number
  onMinutesChange: (minutes: number) => void
  /** The runs have not arrived, so this plan is not the real answer yet. */
  pending?: boolean
  /** The runs could not be read; the plan stands but knows nothing of the history. */
  failed?: boolean
  /** Every open stage of every path has been played today — the good problem (§9). */
  exhausted?: boolean
  /** More of the same, offered rather than left to the user to think of; null when the pack has nothing that fits. */
  onExpand?: (() => void) | null
}

function totalMinutes(plan: SessionPlan): string {
  return formatDuration(plan.plannedSeconds)
}

export function NextSessionCard({
  plan,
  onStart,
  minutes,
  onMinutesChange,
  pending = false,
  failed = false,
  exhausted = false,
  onExpand = null,
}: NextSessionCardProps) {
  const headingId = useId()
  const [open, setOpen] = useState(false)
  const count = plan.slots.length
  const waiting = pending
  const title = 'Next session'
  const exercises = `${count} ${count === 1 ? 'exercise' : 'exercises'}`

  return (
    <section className="flex h-full flex-col rounded-2xl bg-accent p-4 text-on-accent lg:col-span-1" aria-labelledby={headingId}>
      <h2 id={headingId} className="font-display text-lg font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-sm opacity-90">
        {waiting
          ? 'Working out what to practise…'
          : count === 0
            ? 'Nothing to practise yet — add an exercise and it shows up here.'
            : failed
              ? `${exercises} — your runs could not be read, so this is a fresh start rather than your plan.`
              : `${exercises}, put together from what you have played.`}
      </p>
      {count > 0 && !waiting && (
        <p className="mt-0.5 text-sm opacity-75 tabular-nums">About {totalMinutes(plan)}</p>
      )}
      {/* Everything the paths had for today is done. That is the good problem,
          and the answer is more of the same rather than an empty card. */}
      {exhausted && !waiting && (
        <p className="mt-3 rounded-xl bg-on-accent/10 px-3 py-2 text-sm">
          You have played everything your goals asked for today.{' '}
          {onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              className="cursor-pointer font-semibold underline decoration-on-accent/40 underline-offset-4 hover:decoration-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
            >
              Add more like it
            </button>
          ) : (
            'Rest, or play something for the pleasure of it.'
          )}
        </p>
      )}
      <LengthPicker minutes={minutes} onChange={onMinutesChange} />
      {/* The controls hold the foot of the card, however tall its neighbour makes it. */}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Button variant="onAccent" onClick={onStart} disabled={count === 0 || waiting}>
          <PlayIcon />
          Play
        </Button>
        {count > 0 && !waiting && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-on-accent underline decoration-on-accent/40 underline-offset-4 hover:decoration-on-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-accent"
          >
            <InfoIcon />
            What&rsquo;s in it
          </button>
        )}
      </div>
      {open && <PlanDialog plan={plan} title={title} onClose={() => setOpen(false)} />}
    </section>
  )
}

/**
 * How long there is. The whole session is planned to the answer, so this is the
 * one setting that changes what is about to be played — and it sits on the card
 * rather than behind a settings page, because on a busy day it is the first
 * thing the user knows and the app does not (§7, §9).
 */
function LengthPicker({ minutes, onChange }: { minutes: number; onChange: (minutes: number) => void }) {
  const name = useId()
  return (
    <fieldset className="mt-3">
      <legend className="sr-only">How long have you got?</legend>
      <div className="flex flex-wrap gap-1.5">
        {SESSION_MINUTES.map((option) => {
          const chosen = option === minutes
          return (
            <label
              key={option}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-on-accent ${
                chosen ? 'bg-on-accent text-accent' : 'bg-on-accent/10 text-on-accent hover:bg-on-accent/20'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={chosen}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option} min
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * The plan, spelled out: what each exercise is, and the scheduler's reason for
 * it being here, in the scheduler's own words.
 */
function PlanDialog({ plan, title, onClose }: { plan: SessionPlan; title: string; onClose: () => void }) {
  const headingId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    // The top layer keeps it above everything; where showModal is missing, at least open it.
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    closeRef.current?.focus()
    return () => {
      if (typeof dialog.close === 'function') dialog.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // A press on the backdrop lands on the dialog itself; anything inside stops at its own box.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[85dvh] w-auto max-w-lg -translate-y-1/2 overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-panel p-4 text-left text-fg shadow-lg shadow-shade backdrop:bg-fg/25 backdrop:backdrop-blur-sm sm:p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={headingId} className="font-display text-lg font-bold tracking-tight">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {`In playing order, and why each one is here · about ${totalMinutes(plan)}`}
          </p>
        </div>
        <button
          type="button"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-panel-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
        >
          <CloseIcon />
        </button>
      </div>
      <ol className="mt-4 space-y-2.5">
        {plan.slots.map((slot, index) => (
          <li key={slot.exercise.id} className="rounded-2xl border border-line bg-panel-2 p-2.5">
            <div className="flex gap-3">
              <div className="relative shrink-0">
                <ExerciseThumb exercise={slot.exercise} className="h-14 w-24" />
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -left-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-fg text-[11px] font-bold text-canvas tabular-nums"
                >
                  {index + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display font-semibold tracking-tight text-fg">{slot.exercise.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${AREA_BADGE[slot.exercise.area]}`}>
                    {AREA_LABELS[slot.exercise.area]}
                  </span>
                  {details(slot.exercise, slot.tempoBpm).map((detail) => (
                    <span key={detail} className="tabular-nums">
                      {detail}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            {/* The scheduler's own sentence, shown unchanged. */}
            <p className="mt-2 text-sm font-medium text-accent-text">{slot.reason}</p>
            {slot.exercise.about?.[0] && (
              <p className="mt-1.5 line-clamp-3 text-sm text-fg-2">{slot.exercise.about[0]}</p>
            )}
          </li>
        ))}
      </ol>
    </dialog>
  )
}

/** The short facts under a title: how hard, in what key, how fast, how long. */
function details(exercise: Exercise, tempoBpm: number): string[] {
  const home = homeLabel(exercise)
  return [
    `Level ${exercise.level}`,
    ...(home ? [keyLabel(home)] : []),
    tempoBpm === exercise.tempoBpm ? `${tempoBpm} BPM` : `${tempoBpm} of ${exercise.tempoBpm} BPM`,
    formatDuration(exerciseSeconds(exercise)),
  ]
}
