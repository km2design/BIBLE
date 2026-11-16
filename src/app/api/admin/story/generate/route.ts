import { NextResponse } from 'next/server'
import { tomorrowKey } from '../../../../../data/dailyStories'
import { requireAdmin } from '../../../../../lib/adminAuth'
import { ensureStoryForDate, getAdminStory, isAdminEditableDate } from '../../../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: { date?: string } = {}
  try {
    body = (await request.json()) as { date?: string }
  } catch {
    body = {}
  }

  const date = body.date || tomorrowKey()
  if (!isAdminEditableDate(date)) {
    return NextResponse.json({ error: '只能為今日或明日預先生成' }, { status: 400 })
  }

  const result = await ensureStoryForDate(date)
  const row = await getAdminStory(date)
  return NextResponse.json({
    ok: true,
    ...result,
    story: row?.story ?? null,
    message: result.created
      ? '已生成草稿，可在下方批改後儲存。'
      : '已有內容（未覆寫已核准稿）；可繼續批改。',
  })
}