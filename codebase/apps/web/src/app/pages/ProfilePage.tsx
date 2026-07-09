import { useState } from 'react'
import {
  GoalAreaFields,
  LevelFields,
  MinutesFields,
} from '../../components/ProfileFields'
import type { PracticeProfile } from '../../appData/profile'
import { useProfile } from '../ProfileProvider'

/** Edit surface for the onboarding answers (TASK-016). */
export default function ProfilePage() {
  const { profile: storedProfile, saveProfile, isSaving } = useProfile()
  const [profile, setProfile] = useState<PracticeProfile>(storedProfile!)
  const [saved, setSaved] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const edit = (changes: Partial<PracticeProfile>) => {
    setProfile({ ...profile, ...changes })
    setSaved(false)
    setSaveStatus('')
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
            void saveProfile(profile)
              .then(() => {
                setSaved(true)
                setSaveStatus('')
              })
              .catch(() => {
                setSaved(false)
                setSaveStatus('Profile could not be saved.')
              })
          }}
          disabled={isSaving || profile.goalAreas.length === 0}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          Save
        </button>
        <p aria-live="polite" className="text-sm text-zinc-400">
          {saved ? 'Saved.' : ''}
          {saveStatus}
          {profile.goalAreas.length === 0 ? 'Pick at least one goal area.' : ''}
        </p>
      </div>
      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-400">Data sync</h2>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">
            Your profile, practice history, plans, and settings sync to your
            signed-in account. Legacy browser-local JSON backups are no longer
            imported.
          </p>
        </div>
      </section>
    </div>
  )
}
