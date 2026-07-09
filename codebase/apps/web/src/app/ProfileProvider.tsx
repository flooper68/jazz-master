import { useMutation, useQuery } from '@tanstack/react-query'
import {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from 'react'
import type { PracticeProfile } from '../appData/profile'
import { useTRPC } from './trpc'

type ProfileStatus = 'pending' | 'ready' | 'error'

interface ProfileContextValue {
  profile: PracticeProfile | null
  status: ProfileStatus
  isSaving: boolean
  saveProfile: (profile: PracticeProfile) => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

interface ProfileProviderProps {
  children: ReactNode
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const trpc = useTRPC()
  const [savedProfile, setSavedProfile] = useState<PracticeProfile | null>(null)
  const profileQuery = useQuery(trpc.profile.get.queryOptions())
  const saveProfileMutation = useMutation(
    trpc.profile.save.mutationOptions({
      onSuccess(result) {
        if (result.status !== 'ok') return
        setSavedProfile(result.profile)
      },
    }),
  )

  const status: ProfileStatus =
    profileQuery.isPending
      ? 'pending'
      : profileQuery.isError || profileQuery.data?.status !== 'ok'
        ? 'error'
        : 'ready'

  const value: ProfileContextValue = {
    profile:
      savedProfile ??
      (profileQuery.data?.status === 'ok' ? profileQuery.data.profile : null),
    status,
    isSaving: saveProfileMutation.isPending,
    async saveProfile(profile) {
      const result = await saveProfileMutation.mutateAsync(profile)

      if (result.status === 'ok') return

      throw new Error(
        result.status === 'unconfigured'
          ? 'Profile database is not configured'
          : result.message,
      )
    },
  }

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components -- profile context and hook intentionally live with the provider
export function useProfile() {
  const profile = useContext(ProfileContext)

  if (!profile) {
    throw new Error('useProfile must be used within ProfileProvider')
  }

  return profile
}
