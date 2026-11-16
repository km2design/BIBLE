import { NextResponse } from 'next/server'
import { tomorrowKey } from '../../../../../data/dailyStories'
import { requireAdmin } from '../../../../../lib/adminAuth'
import {
  adminImagePreviewUrl,
  ensureStoryForDate,
  getAdminStory,
  isAdminEditableDate,
  regenerateAdminImage,
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
    return NextResponse.json({ error: '只能為今日或明日預先生成' }, { status: 400 })
  }

  const result = await ensureStoryForDate(date)
  // If text existed but image was missing, ensureStoryForDate may have filled it;
  // if still missing (e.g. no key earlier path), try once more without force.
  let row = await getAdminStory(date)
  let imageGenerated = result.imageGenerated
  if (row && !row.hasImage) {
    const img = await regenerateAdminImage(date, undefined, false)
    imageGenerated = imageGenerated || img.generated
    row = await getAdminStory(date)
  }

  const hasImage = Boolean(row?.hasImage)
  const parts: string[] = []
  if (result.created) parts.push('已生成文字草稿')
  else parts.push('已載入既有文稿（未覆寫已核准稿）')
  if (imageGenerated) parts.push('已預產插畫，可在上方預覽')
  else if (hasImage) parts.push('插畫已就緒')
  else parts.push('尚無插畫（缺金鑰或生成失敗則用預設圖；可稍後重產）')
  parts.push('請編輯文字後「儲存核准」；需要可「重產插畫」')

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