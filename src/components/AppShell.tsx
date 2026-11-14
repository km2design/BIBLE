'use client'

import { AudioSettingsProvider } from '../context/AudioSettings'
import { BottomNav } from './BottomNav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AudioSettingsProvider>
      <div className="app-shell">
        {children}
        <BottomNav />
      </div>
    </AudioSettingsProvider>
  )
}
