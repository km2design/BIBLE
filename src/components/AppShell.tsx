'use client'

import { AudioSettingsProvider } from '../context/AudioSettings'
import { BottomNav } from './BottomNav'
import { InstallPrompt } from './InstallPrompt'
import { ServiceWorkerRegister } from './ServiceWorkerRegister'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AudioSettingsProvider>
      <div className="app-shell">
        {children}
        <InstallPrompt />
        <BottomNav />
        <ServiceWorkerRegister />
      </div>
    </AudioSettingsProvider>
  )
}
