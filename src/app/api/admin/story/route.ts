import { NextResponse } from 'next/server'
import { dateKey, tomorrowKey } from '../../../../data/dailyStories'
import { requireAdmin } from '../../../../lib/adminAuth'
import {
  adminImagePreviewUrl,
  getAdminStory,
  isAdminEditableDate,
  saveApprovedStory,
  type AdminStoryPatch,
} from '../../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || tomorrowKey()
  if (!isAdminEditableDate(date)) {
    return NextResponse.json({ error: '只能預覽／編輯今日或明日' }, { status: 400 })
  }

  const row = await getAdminStory(date)
  const hasImage = Boolean(row?.hasImage)
  return NextResponse.json({
    date,
    today: dateKey(),
    tomorrow: tomorrowKey(),
    story: row?.story ?? null,
    source: row?.source ?? null,
    hasImage,
    imageUrl: hasImage ? adminImagePreviewUrl(date, Date.now()) : '/daily/default-hero.jpg',
  })
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: AdminStoryPatch & { date?: string }
  try {
    body = (await request.json()) as AdminStoryPatch & { date?: string }
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const date = body.date || tomorrowKey()
  if (!isAdminEditableDate(date)) {
    return NextResponse.json({ error: '只能儲存今日或明日' }, { status: 400 })
  }

  try {
    const saved = await saveApprovedStory(date, body)
    const row = await getAdminStory(date)
    const hasImage = Boolean(row?.hasImage)
    return NextResponse.json({
      ok: true,
      date,
      story: saved.story,
      source: saved.source,
      hasImage,
      imageUrl: hasImage ? adminImagePreviewUrl(date, Date.now()) : '/daily/default-hero.jpg',
      message:
        date > dateKey()
          ? '已核准明日繪卷（含插畫）；到了該日會自動對外公開。'
          : '已核准並立即套用到公開頁面。',
    })
  } catch {
    return NextResponse.json({ error: '儲存失敗' }, { status: 500 })
  }
}
