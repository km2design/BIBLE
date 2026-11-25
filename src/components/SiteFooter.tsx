import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/privacy">私隱說明</Link>
      <span aria-hidden>·</span>
      <Link href="/settings">音效設定</Link>
    </footer>
  )
}
