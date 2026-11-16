import { NextResponse } from 'next/server'
import { DAILY_ARCHIVE_START, dateKey } from '../../../data/dailyStories'
import { getArchivedStory, getDailyStory } from '../../../lib/grokDaily'
import { clientIp, takeRateLimit } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET(request: Request) {
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`daily:${ip}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('date') || dateKey()
  const today = dateKey()

  if (!isIsoDate(requested)) {
    return NextResponse.json({ error: '日期格式無效' }, { status: 400 })
  }

  // Today: public-safe loader (cache or ephemeral sample; never paid gen).
  if (requested === today) {
    const { story, source } = await getDailyStory(today)
    return NextResponse.json({
      story,
      source: source === 'sample' ? 'sample' : 'cached',
    })
  }

  // Past dates: only finished archived rows from day one onward.
  if (requested > today || requested < DAILY_ARCHIVE_START) {
    return NextResponse.json({ error: '此日期尚無封存故事' }, { status: 404 })
  }

  const archived = await getArchivedStory(requested)
  if (!archived) {
    return NextResponse.json({ error: '此日期尚無封存故事' }, { status: 404 })
  }

  return NextResponse.json({
    story: archived.story,
    source: archived.source === 'sample' ? 'sample' : 'cached',
  })
}
