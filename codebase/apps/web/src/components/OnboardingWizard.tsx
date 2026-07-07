import { useState } from 'react'
import { defaultProfile, type PracticeProfile } from '../storage'
import { GoalAreaFields, LevelFields, MinutesFields } from './ProfileFields'
import { useViewFocus } from './useViewFocus'

interface OnboardingWizardProps {
  /** Receives the finished profile; the caller persists it. */
  onComplete: (profile: PracticeProfile) => void
}

const STEP_TITLES = [
  'How comfortable are you?',
  'What do you want to get better at?',
  'How much time do you have?',
] as const

/**
 * First-run wizard (TASK-016). Every answer starts at the documented default,
 * so finishing — or skipping at any point — always yields a usable profile;
 * skip keeps whatever was already answered.
 */
export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  // createdAt is stamped on completion; the placeholder never persists.
  const [draft, setDraft] = useState(() => defaultProfile(''))

  // Move focus to the heading when the step view swaps without navigation,
  // so keyboard/screen-reader users aren't left on a removed button (ISSUE-002).
  const headingRef = useViewFocus<HTMLHeadingElement>(`step-${step}`)

  const lastStep = step === STEP_TITLES.length - 1
  const goalsEmpty = draft.goalAreas.length === 0
  const finish = () => {
    // Skipping mid-step must still satisfy the contract's non-empty goals.
    const fallback = defaultProfile(new Date().toISOString())
    onComplete({
      ...draft,
      goalAreas: goalsEmpty ? fallback.goalAreas : draft.goalAreas,
      createdAt: fallback.createdAt,
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <section className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <p className="font-display text-sm font-bold tracking-tight text-amber-400">
          Jazz Master
        </p>
        <p className="mt-4 text-xs text-zinc-400">
          Step {step + 1} of {STEP_TITLES.length}
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
        >
          {STEP_TITLES[step]}
        </h1>
        <div className="mt-6">
          {step === 0 && (
            <LevelFields
              levels={draft.levels}
              onChange={(levels) => setDraft({ ...draft, levels })}
            />
          )}
          {step === 1 && (
            <GoalAreaFields
              goalAreas={draft.goalAreas}
              onChange={(goalAreas) => setDraft({ ...draft, goalAreas })}
            />
          )}
          {step === 2 && (
            <MinutesFields
              minutesPerDay={draft.minutesPerDay}
              onChange={(minutesPerDay) => setDraft({ ...draft, minutesPerDay })}
            />
          )}
        </div>
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={lastStep ? finish : () => setStep(step + 1)}
            disabled={step === 1 && goalsEmpty}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {lastStep ? 'Start practicing' : 'Next'}
          </button>
          <button
            type="button"
            onClick={finish}
            className="ml-auto text-sm text-zinc-400 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            Skip for now
          </button>
        </div>
        {step === 1 && goalsEmpty && (
          <p className="mt-3 text-xs text-zinc-400">
            Pick at least one area to continue, or skip to use the defaults.
          </p>
        )}
      </section>
    </div>
  )
}
