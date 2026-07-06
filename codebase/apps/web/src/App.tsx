import { useState } from 'react'
import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { OnboardingWizard } from './components/OnboardingWizard'
import DashboardPage from './pages/DashboardPage'
import EarTrainingPage from './pages/EarTrainingPage'
import NotFoundPage from './pages/NotFoundPage'
import PracticePage from './pages/PracticePage'
import ProfilePage from './pages/ProfilePage'
import ProgressionsPage from './pages/ProgressionsPage'
import RepertoirePage from './pages/RepertoirePage'
import VoicingsPage from './pages/VoicingsPage'
import { profileStore } from './storage'

function App() {
  // First-run gate (TASK-016): no stored profile means onboarding has never
  // run, so every path shows the wizard until one is persisted.
  const [profile, setProfile] = useState(() => profileStore.get())

  if (profile === null) {
    return (
      <OnboardingWizard
        onComplete={(completed) => {
          profileStore.set(completed)
          setProfile(completed)
        }}
      />
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="voicings" element={<VoicingsPage />} />
        <Route path="progressions" element={<ProgressionsPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="repertoire" element={<RepertoirePage />} />
        <Route path="ear-training" element={<EarTrainingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
