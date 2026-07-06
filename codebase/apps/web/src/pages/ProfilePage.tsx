import { useState } from 'react'
import {
  GoalAreaFields,
  LevelFields,
  MinutesFields,
} from '../components/ProfileFields'
import { defaultProfile, profileStore, type PracticeProfile } from '../storage'

/** Edit surface for the onboarding answers (TASK-016). */
export default function ProfilePage() {
  // The App gate guarantees a stored profile; the fallback is belt-and-braces
  // for a cleared store in another tab.
  const [profile, setProfile] = useState<PracticeProfile>(
    () => profileStore.get() ?? defaultProfile(new Date().toISOString()),
  )
  const [saved, setSaved] = useState(false)

  const edit = (changes: Partial<PracticeProfile>) => {
    setProfile({ ...profile, ...changes })
    setSaved(false)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-4 text-zinc-300">
        Your practice profile — the planner sizes and picks lessons from this.
      </p>
      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-400">Comfort level</h2>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <LevelFields
            levels={profile.levels}
            onChange={(levels) => edit({ levels })}
          />
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-400">Goals</h2>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <GoalAreaFields
            goalAreas={profile.goalAreas}
            onChange={(goalAreas) => edit({ goalAreas })}
          />
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-400">Time budget</h2>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <MinutesFields
            minutesPerDay={profile.minutesPerDay}
            onChange={(minutesPerDay) => edit({ minutesPerDay })}
          />
        </div>
      </section>
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            profileStore.set(profile)
            setSaved(true)
          }}
          disabled={profile.goalAreas.length === 0}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          Save
        </button>
        <p aria-live="polite" className="text-sm text-zinc-400">
          {saved ? 'Saved.' : ''}
          {profile.goalAreas.length === 0 ? 'Pick at least one goal area.' : ''}
        </p>
      </div>
    </div>
  )
}
