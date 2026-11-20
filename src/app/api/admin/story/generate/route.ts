import { NextResponse } from 'next/server'
import { tomorrowKey } from '../../../../../data/dailyStories'
import { requireAdmin } from '../../../../../lib/adminAuth'
import {
  adminImagePreviewUrl,
  ensureStoryForDate,
  getAdminStory,
  isAdminEditableDate,
} from '../../../../../lib/grokDaily'

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
    return NextResponse.json({ error: '只能為今起一週內預先生成' }, { status: 400 })
  }

  const result = await ensureStoryForDate(date)
  const row = await getAdminStory(date)
  const imageGenerated = result.imageGenerated
  const hasImage = Boolean(row?.hasImage)
  const parts: string[] = []
  if (result.created) parts.push('已生成文字草稿')
  else parts.push('已載入既有文稿（未覆寫已核准／正式稿）')
  if (imageGenerated) parts.push('已自動 GEN 圖，可預覽')
  else if (hasImage) parts.push('插畫已就緒')
  else parts.push('尚未 GEN 圖（人手模式請按「GEN 圖」）')
  parts.push('請批改後「儲存核准」；不滿意可「再 GEN 圖」')

  return NextResponse.json({
    ok: true,
    ...result,
    imageGenerated,
    hasImage,
    imageUrl: hasImage ? adminImagePreviewUrl(date, Date.now()) : '/daily/default-hero.jpg',
    story: row?.story ?? null,
    source: row?.source ?? result.source,
    message: parts.join('；'),
  })
}
