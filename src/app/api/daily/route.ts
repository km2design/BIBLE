import { NextResponse } from 'next/server'
import { dateKey, withCharacter } from '../../../data/dailyStories'
import { getDailyStory } from '../../../lib/grokDaily'
import { clientIp, takeRateLimit } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`daily:${ip}`, 30, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const requested = searchParams.get('date') || dateKey()
  // Only today is accepted for the public endpoint; blocks date-scanning abuse.
  const date = requested === dateKey() ? requested : dateKey()

  const { story, source } = await getDailyStory(date)
  return NextResponse.json({
    story: withCharacter(story),
    source: source === 'grok' ? 'grok' : 'sample',
  })
}
