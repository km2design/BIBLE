import { NavLink, useLocation } from 'react-router-dom'

export function BottomNav() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/watch')) return null

  return (
    <nav className="bottom-nav" aria-label="主要導覽">
      <NavLink to="/" end>
        首頁
      </NavLink>
      <NavLink to="/library">繪卷</NavLink>
      <NavLink to="/devotion">靈修</NavLink>
    </nav>
  )
}
