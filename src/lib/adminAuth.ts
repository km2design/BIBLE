import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

const COOKIE = 'guangdao_admin'
const MAX_AGE_SEC = 60 * 60 * 12 // 12 hours

export type AdminConfig = {
  username: string
  password: string
}

/** Fail closed when admin secrets are missing. */
export function getAdminConfig(): AdminConfig | null {
  const username = process.env.ADMIN_USERNAME?.trim() || ''
  const password = process.env.ADMIN_PASSWORD?.trim() || ''
  if (!username || !password) return null
  return { username, password }
}

function signingKey(password: string): string {
  return `guangdao-admin-v1:${password}`
}

function sign(payload: string, password: string): string {
  return createHmac('sha256', signingKey(password)).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function createAdminSessionToken(username: string, password: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  const payload = `${username}:${exp}`
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload, password)}`
}

export function verifyAdminSessionToken(
  token: string | undefined,
  config: AdminConfig,
): boolean {
  if (!token) return false
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) return false
  let payload = ''
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8')
  } catch {
    return false
  }
  const expected = sign(payload, config.password)
  if (!safeEqual(expected, sig)) return false
  const [user, expRaw] = payload.split(':')
  const exp = Number(expRaw)
  if (!user || !Number.isFinite(exp)) return false
  if (user !== config.username) return false
  if (exp < Math.floor(Date.now() / 1000)) return false
  return true
}

export function readAdminCookie(request: Request): string | undefined {
  const raw = request.headers.get('cookie') || ''
  const parts = raw.split(';').map((p) => p.trim())
  for (const part of parts) {
    if (part.startsWith(`${COOKIE}=`)) {
      return decodeURIComponent(part.slice(COOKIE.length + 1))
    }
  }
  return undefined
}

export function requireAdmin(request: Request):
  | { ok: true; config: AdminConfig }
  | { ok: false; response: NextResponse } {
  const config = getAdminConfig()
  if (!config) {
    return {
      ok: false,
      response: NextResponse.json({ error: '管理後台未啟用（缺少環境密鑰）' }, { status: 503 }),
    }
  }
  const token = readAdminCookie(request)
  if (!verifyAdminSessionToken(token, config)) {
    return {
      ok: false,
      response: NextResponse.json({ error: '未登入' }, { status: 401 }),
    }
  }
  return { ok: true, config }
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.headers.append(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}${secure}`,
  )
}

export function clearAdminSessionCookie(response: NextResponse): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.headers.append(
    'Set-Cookie',
    `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  )
}

export function credentialsMatch(
  config: AdminConfig,
  username: string,
  password: string,
): boolean {
  const userDigest = createHmac('sha256', 'user').update(username).digest()
  const expectUser = createHmac('sha256', 'user').update(config.username).digest()
  const passDigest = createHmac('sha256', 'pass').update(password).digest()
  const expectPass = createHmac('sha256', 'pass').update(config.password).digest()
  return timingSafeEqual(userDigest, expectUser) && timingSafeEqual(passDigest, expectPass)
}
