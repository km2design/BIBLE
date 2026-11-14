import { NextResponse } from 'next/server'
import { ensureTodayStory } from '../../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const header = request.headers.get('x-cron-secret')?.trim() || ''
  return bearer === secret || header === secret
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await ensureTodayStory()
    return NextResponse.json({
      ok: true,
      ...result,
      message: result.created
        ? '已生成／寫入今日故事'
        : '今日故事已存在，略過重複生成',
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
