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
    const parts: string[] = []
    if (result.created) parts.push('已生成／寫入今日故事')
    else parts.push('今日故事已存在，略過重複文字生成')
    if (result.imageGenerated) parts.push('已生成當日插畫')
    else parts.push('插畫已存在或略過（無金鑰／失敗則用預設英雄圖）')
    return NextResponse.json({
      ok: true,
      ...result,
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
