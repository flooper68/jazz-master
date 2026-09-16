import { useState } from 'react'
import { defaultProfile, type PracticeProfile } from '../appData/profile'
import { GoalAreaFields, LevelFields, MinutesFields } from './ProfileFields'
import { useViewFocus } from './useViewFocus'

interface OnboardingWizardProps {
  /** Receives the finished profile; the caller persists it. */
  onComplete: (profile: PracticeProfile) => void
  isSaving?: boolean
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
export function OnboardingWizard({
  isSaving = false,
  onComplete,
}: OnboardingWizardProps) {
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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-fg">
      <section className="w-full max-w-lg rounded-2xl border border-line bg-panel p-8">
        <p className="font-display text-lg font-extrabold tracking-tight">
          woodshed
        </p>
        <p className="mt-4 text-xs text-muted">
          Step {step + 1} of {STEP_TITLES.length}
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 font-display text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
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
              className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-fg-2 hover:border-fg hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={lastStep ? finish : () => setStep(step + 1)}
            disabled={isSaving || (step === 1 && goalsEmpty)}
            className="rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-fg hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-muted"
          >
            {lastStep ? 'Start practicing' : 'Next'}
          </button>
          <button
            type="button"
            onClick={finish}
            disabled={isSaving}
            className="ml-auto text-sm text-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            Skip for now
          </button>
        </div>
        {step === 1 && goalsEmpty && (
          <p className="mt-3 text-xs text-muted">
            Pick at least one area to continue, or skip to use the defaults.
          </p>
        )}
      </section>
    </div>
  )
}
