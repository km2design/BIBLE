import type { Metadata, Viewport } from 'next'
import { AppShell } from '../components/AppShell'
import '@fontsource/noto-serif-tc/chinese-traditional-400.css'
import '@fontsource/noto-serif-tc/chinese-traditional-700.css'
import '@fontsource/noto-serif-tc/latin-400.css'
import '@fontsource/noto-serif-tc/latin-700.css'
import './globals.css'

export const metadata: Metadata = {
  title: '光道 · 四福音繪卷',
  description: '公仔角色讀經得智慧：每日故事、靈修反思與溫柔留言。',
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
