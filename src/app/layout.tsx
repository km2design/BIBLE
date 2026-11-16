import type { Metadata, Viewport } from 'next'
import { AppShell } from '../components/AppShell'
import '@fontsource/noto-serif-tc/chinese-traditional-400.css'
import '@fontsource/noto-serif-tc/chinese-traditional-700.css'
import '@fontsource/noto-serif-tc/latin-400.css'
import '@fontsource/noto-serif-tc/latin-700.css'
import './globals.css'

export const metadata: Metadata = {
  title: '光道 · 和合本與每日智慧',
  description: '和合本聖經自由讀經、每日智慧繪卷、馬太繪卷與靈修留言。',
  applicationName: '光道',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '光道',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0c1a24',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
