import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { ensurePublicSyncOnce, ensureTodayStory } from '../../../../lib/grokDaily'
import { takeRateLimit } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

function safeEqualSecret(provided: string, expected: string): boolean {
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  if (left.length !== right.length) {
    // Constant-ish work even on length mismatch.
    timingSafeEqual(right, right)
    return false
  }
  return timingSafeEqual(left, right)
}

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const header = request.headers.get('x-cron-secret')?.trim() || ''
  return (
    (bearer !== '' && safeEqualSecret(bearer, secret)) ||
    (header !== '' && safeEqualSecret(header, secret))
  )
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Even with a valid secret, cap calls to limit paid xAI burn if the secret leaks.
  const allowed = await takeRateLimit('cron:daily-story', 3, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Cron rate limit exceeded' }, { status: 429 })
  }

  try {
    const sync = await ensurePublicSyncOnce()
    const result = await ensureTodayStory()
    const parts: string[] = []
    if (sync) {
      parts.push(
        `公開同步：清 ${sync.cleared.length}／刷 ${sync.refreshed.length}／核准 ${sync.approvedPublic.length}`,
      )
    }
    if (result.created) parts.push('已生成／寫入今日故事')
    else parts.push('今日故事已存在，略過重複文字生成')
    if (result.imageGenerated) parts.push('已生成當日插畫')
    else parts.push('插畫已存在或略過（無金鑰／失敗則用預設英雄圖）')
    return NextResponse.json({
      ok: true,
      ...result,
      sync,
      message: parts.join('；'),
    })
  } catch {
    return NextResponse.json({ error: '生成失敗' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
