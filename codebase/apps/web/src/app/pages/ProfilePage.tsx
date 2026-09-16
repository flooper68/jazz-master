import { Button, Card } from '../../components/ui/Primitives'
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
        <Card className="mt-3">
          <LevelFields
            levels={profile.levels}
            onChange={(levels) => edit({ levels })}
          />
        </Card>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-400">Goals</h2>
        <Card className="mt-3">
          <GoalAreaFields
            goalAreas={profile.goalAreas}
            onChange={(goalAreas) => edit({ goalAreas })}
          />
        </Card>
      </section>
      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-400">Time budget</h2>
        <Card className="mt-3">
          <MinutesFields
            minutesPerDay={profile.minutesPerDay}
            onChange={(minutesPerDay) => edit({ minutesPerDay })}
          />
        </Card>
      </section>
      <div className="mt-8 flex items-center gap-4">
        <Button
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
        >
          Save
        </Button>
        <p aria-live="polite" className="text-sm text-zinc-400">
          {saved ? 'Saved.' : ''}
          {saveStatus}
          {profile.goalAreas.length === 0 ? 'Pick at least one goal area.' : ''}
        </p>
      </div>
      <section className="mt-10">
        <h2 className="text-sm font-medium text-zinc-400">Data sync</h2>
        <Card className="mt-3">
          <p className="text-sm text-zinc-300">
            Your profile, practice history, plans, and settings sync to your
            signed-in account, so they are available wherever you sign in.
          </p>
        </Card>
      </section>
    </div>
  )
}
