import { type ChangeEvent, useState } from 'react'
import {
  GoalAreaFields,
  LevelFields,
  MinutesFields,
} from '../../components/ProfileFields'
import {
  importStorageBackupText,
  MAX_STORAGE_BACKUP_BYTES,
  serializeStorageBackup,
} from '../../storage'
import type { PracticeProfile } from '../../appData/profile'
import { useProfile } from '../ProfileProvider'

/** Edit surface for the onboarding answers (TASK-016). */
export default function ProfilePage() {
  const { profile: storedProfile, saveProfile, isSaving } = useProfile()
  const [profile, setProfile] = useState<PracticeProfile>(storedProfile!)
  const [saved, setSaved] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [backupStatus, setBackupStatus] = useState('')

  const edit = (changes: Partial<PracticeProfile>) => {
    setProfile({ ...profile, ...changes })
    setSaved(false)
    setSaveStatus('')
  }

  const exportBackup = () => {
    const exportedAt = new Date()
    const json = serializeStorageBackup(exportedAt)
    const link = document.createElement('a')
    link.href = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`
    link.download = `jazz-master-backup-${exportedAt.toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setBackupStatus('Backup downloaded.')
  }

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    if (file.size > MAX_STORAGE_BACKUP_BYTES) {
      setBackupStatus('Backup file is too large.')
      return
    }

    try {
      const result = importStorageBackupText(await file.text())
      if (!result.ok) {
        setBackupStatus(result.error)
        return
      }
      setSaved(false)
      setBackupStatus('Backup imported.')
    } catch {
      setBackupStatus('Backup file could not be read.')
    }
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
        <h2 className="text-sm font-medium text-zinc-400">Data backup</h2>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-300">
            Download a JSON backup of plans, history, and practice settings.
            Import replaces this browser's local data.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportBackup}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              Export backup
            </button>
            <label
              htmlFor="profile-backup-import"
              className="cursor-pointer rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-zinc-400"
            >
              Import backup
              <input
                id="profile-backup-import"
                type="file"
                accept="application/json,.json"
                onChange={importBackup}
                className="sr-only"
              />
            </label>
          </div>
          <p aria-live="polite" className="mt-3 text-sm text-zinc-400">
            {backupStatus}
          </p>
        </div>
      </section>
    </div>
  )
}
