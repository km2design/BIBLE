import { NextResponse } from 'next/server'
import {
  createAdminSessionToken,
  credentialsMatch,
  getAdminConfig,
  setAdminSessionCookie,
} from '../../../../lib/adminAuth'
import { clientIp, takeRateLimit } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const config = getAdminConfig()
  if (!config) {
    return NextResponse.json({ error: '管理後台未啟用（缺少環境密鑰）' }, { status: 503 })
  }

  const ip = clientIp(request)
  const allowed = await takeRateLimit(`admin-login:${ip}`, 10, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: '嘗試過於頻繁，請稍後再試' }, { status: 429 })
  }

  let body: { username?: string; password?: string }
  try {
    body = (await request.json()) as { username?: string; password?: string }
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const username = String(body.username || '')
  const password = String(body.password || '')
  if (!credentialsMatch(config, username, password)) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 })
  }

  const token = createAdminSessionToken(config.username, config.password)
  const res = NextResponse.json({ ok: true, username: config.username })
  setAdminSessionCookie(res, token)
  return res
}
