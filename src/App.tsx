import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { Library } from './pages/Library'
import { Watch } from './pages/Watch'
import { Devotion } from './pages/Devotion'
import { BottomNav } from './components/BottomNav'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/devotion" element={<Devotion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
