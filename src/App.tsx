import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { AudioSettingsProvider } from './context/AudioSettings'
import { Devotion } from './pages/Devotion'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { Settings } from './pages/Settings'
import { Watch } from './pages/Watch'

export default function App() {
  return (
    <AudioSettingsProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/library" element={<Library />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/devotion" element={<Devotion />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AudioSettingsProvider>
  )
}
