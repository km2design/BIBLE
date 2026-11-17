import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../../lib/adminAuth'
import {
  PUBLIC_SYNC_FROM_DATE,
  syncPublicFromApproved,
} from '../../../../../lib/grokDaily'

export const dynamic = 'force-dynamic'

/**
 * Admin: force Mode B, purge sample/grok/pending from a date onward,
 * refresh stale pre-茶記 approved payloads, optionally promote drafts.
 */
export async function POST(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: { fromDate?: string; promoteDrafts?: boolean } = {}
  try {
    body = (await request.json()) as { fromDate?: string; promoteDrafts?: boolean }
  } catch {
    body = {}
  }

  const fromDate = body.fromDate || PUBLIC_SYNC_FROM_DATE
  try {
    const report = await syncPublicFromApproved(fromDate, {
      promoteDrafts: Boolean(body.promoteDrafts),
    })
    const parts = [
      `已鎖定模式 B`,
      `清除未核准公開列 ${report.cleared.length} 日`,
      `刷新舊樣本核准 ${report.refreshed.length} 日`,
      `公開核准 ${report.approvedPublic.length} 日`,
    ]
    if (report.promoted?.length) parts.push(`草稿升核准 ${report.promoted.length} 日`)
    return NextResponse.json({
      ok: true,
      report,
      message: parts.join('；'),
    })
  } catch {
    return NextResponse.json({ error: '同步失敗' }, { status: 500 })
  }
}
