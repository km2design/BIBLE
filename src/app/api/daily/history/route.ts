import { NextResponse } from 'next/server'
import { dateKey } from '../../../../data/dailyStories'
import { listDailyHistory } from '../../../../lib/grokDaily'
import { clientIp, takeRateLimit } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`daily-history:${ip}`, 20, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const limitRaw = Number(searchParams.get('limit') || '60')
  const limit = Number.isFinite(limitRaw) ? limitRaw : 60
  const items = await listDailyHistory(limit)
  return NextResponse.json({ today: dateKey(), items })
}
