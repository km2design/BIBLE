import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getStoryImage } from '../../../../lib/grokDaily'
import { clientIp, takeRateLimit } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

async function defaultHeroResponse(): Promise<NextResponse> {
  try {
    const file = path.join(process.cwd(), 'public', 'daily', 'default-hero.jpg')
    const bytes = await readFile(file)
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: '預設插畫缺失' }, { status: 404 })
  }
}

export async function GET(request: Request) {
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`daily-image:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || ''
  if (!isIsoDate(date)) {
    return defaultHeroResponse()
  }

  const stored = await getStoryImage(date)
  if (!stored) return defaultHeroResponse()

  return new NextResponse(new Uint8Array(stored.bytes), {
    headers: {
      'Content-Type': stored.mime,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
