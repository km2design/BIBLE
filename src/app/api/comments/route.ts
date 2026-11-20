import { NextResponse } from 'next/server'
import { dateKey } from '../../../data/dailyStories'
import { sql } from '../../../lib/db'
import {
  COMMENT_RULES,
  containsBlockedLanguage,
  sanitizeBody,
  sanitizeNickname,
} from '../../../lib/moderation'
import { clientIp, takeRateLimit } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

type CommentRow = {
  id: string
  story_date: string
  nickname: string
  body: string
  created_at: string
  parent_id: string | null
  is_admin: boolean
}

export async function GET(request: Request) {
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`comments-read:${ip}`, 60, 60_000)
  if (!allowed) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || dateKey()
  try {
    const rows = await sql<CommentRow>(
      `select id::text, story_date::text, nickname, body, created_at::text,
              parent_id::text, is_admin
       from comments
       where story_date = $1::date and hidden = false
       order by created_at asc
       limit 100`,
      [date],
    )
    return NextResponse.json({ comments: rows, rules: COMMENT_RULES })
  } catch {
    return NextResponse.json({ comments: [], rules: COMMENT_RULES, sample: true })
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request)
  // Tightened limits + honeypot below.
  const allowedMinute = await takeRateLimit(`comments-write:${ip}`, 3, 60_000)
  if (!allowedMinute) {
    return NextResponse.json({ error: '留言太頻繁，請稍後再試' }, { status: 429 })
  }
  const allowedDay = await takeRateLimit(`comments-write-day:${ip}`, 20, 86_400_000)
  if (!allowedDay) {
    return NextResponse.json({ error: '今日留言已達上限，請明天再來' }, { status: 429 })
  }

  let payload: {
    date?: string
    nickname?: string
    body?: string
    website?: string
    company?: string
    startedAt?: number
  }
  try {
    payload = (await request.json()) as typeof payload
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  // Honeypot: bots fill hidden fields; humans leave them empty.
  if ((payload.website && payload.website.trim()) || (payload.company && payload.company.trim())) {
    return NextResponse.json({ comment: { id: '0', nickname: 'ok', body: 'ok', created_at: new Date().toISOString() }, rules: COMMENT_RULES })
  }

  // Reject absurdly fast submits (< 1.2s) when client sends startedAt.
  if (typeof payload.startedAt === 'number' && Number.isFinite(payload.startedAt)) {
    const elapsed = Date.now() - payload.startedAt
    if (elapsed >= 0 && elapsed < 1200) {
      return NextResponse.json({ error: '請稍候再送出' }, { status: 429 })
    }
  }

  const date = payload.date || dateKey()
  // Public comments only for today (and past archive days); block future spam targets.
  if (date > dateKey()) {
    return NextResponse.json({ error: '尚不可留言' }, { status: 400 })
  }

  const nickname = sanitizeNickname(payload.nickname ?? '')
  const body = sanitizeBody(payload.body ?? '')

  if (nickname.length < 1) {
    return NextResponse.json({ error: '請填寫暱稱' }, { status: 400 })
  }
  if (body.length < 2) {
    return NextResponse.json({ error: '留言太短' }, { status: 400 })
  }
  if (containsBlockedLanguage(`${nickname} ${body}`)) {
    return NextResponse.json(
      { error: '留言含有不當用語，請修改後再送出。違規內容會由版主刪除。' },
      { status: 400 },
    )
  }

  try {
    const rows = await sql<CommentRow>(
      `insert into comments (story_date, nickname, body)
       values ($1::date, $2, $3)
       returning id::text, story_date::text, nickname, body, created_at::text,
                 parent_id::text, is_admin`,
      [date, nickname, body],
    )
    return NextResponse.json({ comment: rows[0], rules: COMMENT_RULES })
  } catch {
    return NextResponse.json(
      { error: '暫時無法儲存留言，請稍後再試。', rules: COMMENT_RULES },
      { status: 503 },
    )
  }
}
