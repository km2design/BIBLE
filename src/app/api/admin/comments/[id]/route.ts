import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/adminAuth'
import { sql } from '../../../../../lib/db'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: '無效的留言編號' }, { status: 400 })
  }

  try {
    const rows = await sql<{ id: string }>(
      `update comments set hidden = true where id = $1::bigint returning id::text`,
      [id],
    )
    if (!rows[0]) {
      return NextResponse.json({ error: '找不到留言' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, id: rows[0].id })
  } catch {
    return NextResponse.json({ error: '刪除失敗' }, { status: 500 })
  }
}
