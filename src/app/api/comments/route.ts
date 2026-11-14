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
}

export async function GET(request: Request) {
  const ip = clientIp(request)
  const allowed = await takeRateLimit(`comments-read:${ip}`, 60, 60_000, { failOpen: true })
  if (!allowed) {
    return NextResponse.json({ error: '請求過於頻繁，請稍後再試' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || dateKey()
  try {
    const rows = await sql<CommentRow>(
      `select id::text, story_date::text, nickname, body, created_at::text
       from comments
       where story_date = $1::date and hidden = false
       order by created_at desc
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
  const allowedMinute = await takeRateLimit(`comments-write:${ip}`, 5, 60_000, { failOpen: false })
  if (!allowedMinute) {
    return NextResponse.json({ error: '留言太頻繁，請稍後再試' }, { status: 429 })
  }
  const allowedDay = await takeRateLimit(`comments-write-day:${ip}`, 30, 86_400_000, {
    failOpen: false,
  })
  if (!allowedDay) {
    return NextResponse.json({ error: '今日留言已達上限，請明天再來' }, { status: 429 })
  }

  let payload: { date?: string; nickname?: string; body?: string }
  try {
    payload = (await request.json()) as { date?: string; nickname?: string; body?: string }
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const date = payload.date || dateKey()
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
       returning id::text, story_date::text, nickname, body, created_at::text`,
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
