import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import EarTrainingPage from './pages/EarTrainingPage'
import NotFoundPage from './pages/NotFoundPage'
import PracticePage from './pages/PracticePage'
import ProgressionsPage from './pages/ProgressionsPage'
import RepertoirePage from './pages/RepertoirePage'
import VoicingsPage from './pages/VoicingsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="voicings" element={<VoicingsPage />} />
        <Route path="progressions" element={<ProgressionsPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="repertoire" element={<RepertoirePage />} />
        <Route path="ear-training" element={<EarTrainingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
