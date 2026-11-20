import { NextResponse } from 'next/server'
import { dateKey, weekDatesFrom } from '../../../../../data/dailyStories'
import { requireAdmin } from '../../../../../lib/adminAuth'
import {
  ensureWeekStories,
  isAdminEditableDate,
  listWeekStories,
} from '../../../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start') || dateKey()
  if (!isAdminEditableDate(start)) {
    return NextResponse.json({ error: '起始日須在可編輯一週內' }, { status: 400 })
  }

  const items = await listWeekStories(start)
  return NextResponse.json({
    start,
    dates: weekDatesFrom(start),
    today: dateKey(),
    items,
  })
}

export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: { start?: string } = {}
  try {
    body = (await request.json()) as { start?: string }
  } catch {
    body = {}
  }

  const start = body.start || dateKey()
  if (!isAdminEditableDate(start)) {
    return NextResponse.json({ error: '起始日須在可編輯一週內' }, { status: 400 })
  }

  const result = await ensureWeekStories(start)
  return NextResponse.json({
    ok: true,
    start: result.start,
    results: result.results,
    items: result.items,
    message: `已預產 ${result.results.length} 日文字（已核准日略過）；請逐日批改／GEN 圖／核准。公開規則依目前發布模式。`,
  })
}
