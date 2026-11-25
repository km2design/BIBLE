'use client'

import { usePathname } from 'next/navigation'
import { AudioSettingsProvider } from '../context/AudioSettings'
import { BottomNav } from './BottomNav'
import { InstallPrompt } from './InstallPrompt'
import { ServiceWorkerRegister } from './ServiceWorkerRegister'
import { SiteFooter } from './SiteFooter'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideChrome =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/watch') ||
    pathname.startsWith('/settings')

  return (
    <AudioSettingsProvider>
      <div className="app-shell">
        {children}
        {!hideChrome ? <SiteFooter /> : null}
        <InstallPrompt />
        <BottomNav />
        <ServiceWorkerRegister />
      </div>
    </AudioSettingsProvider>
  )
}
