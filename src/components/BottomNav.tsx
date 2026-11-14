'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()
  if (pathname.startsWith('/watch') || pathname.startsWith('/settings')) return null

  const item = (href: string, label: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return (
      <Link href={href} className={active ? 'active' : undefined}>
        {label}
      </Link>
    )
  }

  return (
    <nav className="bottom-nav" aria-label="主要導覽">
      {item('/', '首頁', true)}
      {item('/matthew', '馬太')}
      {item('/daily', '每日')}
      {item('/devotion', '靈修')}
    </nav>
  )
}
