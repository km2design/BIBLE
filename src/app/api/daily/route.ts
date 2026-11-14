import { NextResponse } from 'next/server'
import { dateKey, withCharacter } from '../../../data/dailyStories'
import { getDailyStory } from '../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || dateKey()
  const story = withCharacter(await getDailyStory(date))
  return NextResponse.json({
    story,
    source: story.sample ? 'sample' : 'grok',
  })
}
