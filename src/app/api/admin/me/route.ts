import { NextResponse } from 'next/server'
import { getAdminConfig, requireAdmin } from '../../../../lib/adminAuth'
import { dateKey, tomorrowKey } from '../../../../data/dailyStories'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!getAdminConfig()) {
    return NextResponse.json({ enabled: false, authenticated: false }, { status: 503 })
  }
  const auth = requireAdmin(request)
  if (!auth.ok) {
    return NextResponse.json({ enabled: true, authenticated: false }, { status: 401 })
  }
  return NextResponse.json({
    enabled: true,
    authenticated: true,
    username: auth.config.username,
    today: dateKey(),
    tomorrow: tomorrowKey(),
  })
}
