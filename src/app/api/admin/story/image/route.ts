import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { tomorrowKey } from '../../../../../data/dailyStories'
import { requireAdmin } from '../../../../../lib/adminAuth'
import {
  getStoryImage,
  isAdminEditableDate,
  regenerateAdminImage,
  type AdminStoryPatch,
} from '../../../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

async function defaultHeroResponse(): Promise<NextResponse> {
  try {
    const file = path.join(process.cwd(), 'public', 'daily', 'default-hero.jpg')
    const bytes = await readFile(file)
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch {
    return NextResponse.json({ error: '預設插畫缺失' }, { status: 404 })
  }
}

/** Auth-only preview (includes tomorrow / day-ahead images). */
export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || tomorrowKey()
  if (!isAdminEditableDate(date)) {
    return NextResponse.json({ error: '只能預覽今日或明日插畫' }, { status: 400 })
  }

  const stored = await getStoryImage(date)
  if (!stored) return defaultHeroResponse()

  return new NextResponse(new Uint8Array(stored.bytes), {
    headers: {
      'Content-Type': stored.mime,
      'Cache-Control': 'private, no-store',
    },
  })
}

/** Force-regenerate illustration from current/edited story text. */
export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: AdminStoryPatch & { date?: string; force?: boolean } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    body = {}
  }

  const date = body.date || tomorrowKey()
  if (!isAdminEditableDate(date)) {
    return NextResponse.json({ error: '只能為今日或明日重產插畫' }, { status: 400 })
  }

  try {
    const { force, ...rest } = body
    const { date: _ignored, ...patch } = rest
    void _ignored
    const result = await regenerateAdminImage(date, patch, force !== false)
    return NextResponse.json({
      ok: result.generated || result.hasImage,
      date,
      generated: result.generated,
      hasImage: result.hasImage,
      story: result.story,
      source: result.source,
      imageUrl: result.story.imageUrl,
      message: result.generated
        ? '已依目前文稿重產插畫，可預覽後再核准。'
        : result.reason || '未能重產插畫',
      error: result.generated ? undefined : result.reason,
    }, { status: result.generated || result.hasImage ? 200 : 502 })
  } catch {
    return NextResponse.json({ error: '插畫生成失敗' }, { status: 500 })
  }
}
