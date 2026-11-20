import { NextResponse } from 'next/server'
import { dateKey } from '../../../../data/dailyStories'
import { requireAdmin } from '../../../../lib/adminAuth'
import { sql } from '../../../../lib/db'
import { sanitizeBody } from '../../../../lib/moderation'

export const dynamic = 'force-dynamic'

type CommentRow = {
  id: string
  story_date: string
  nickname: string
  body: string
  hidden: boolean
  is_admin: boolean
  parent_id: string | null
  created_at: string
}

export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || dateKey()
  const includeHidden = searchParams.get('all') === '1'

  try {
    const rows = await sql<CommentRow>(
      `select id::text, story_date::text, nickname, body, hidden, is_admin,
              parent_id::text, created_at::text
       from comments
       where story_date = $1::date
         and ($2::boolean or hidden = false)
       order by created_at desc
       limit 200`,
      [date, includeHidden],
    )
    return NextResponse.json({ date, comments: rows })
  } catch {
    return NextResponse.json({ date, comments: [], error: '讀取失敗' }, { status: 503 })
  }
}

/** Admin reply on a comment thread (or top-level note). */
export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let payload: { date?: string; body?: string; parentId?: string }
  try {
    payload = (await request.json()) as { date?: string; body?: string; parentId?: string }
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const date = payload.date || dateKey()
  const body = sanitizeBody(payload.body ?? '')
  if (body.length < 1) {
    return NextResponse.json({ error: '回覆內容太短' }, { status: 400 })
  }

  try {
    const rows = await sql<CommentRow>(
      `insert into comments (story_date, nickname, body, parent_id, is_admin, hidden)
       values ($1::date, $2, $3, $4::bigint, true, false)
       returning id::text, story_date::text, nickname, body, hidden, is_admin,
                 parent_id::text, created_at::text`,
      [date, '光道', body, payload.parentId || null],
    )
    return NextResponse.json({ comment: rows[0] })
  } catch {
    return NextResponse.json({ error: '回覆失敗' }, { status: 500 })
  }
}
