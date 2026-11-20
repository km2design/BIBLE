import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import { getAdminUsageStats, listAdminArchive } from '../../../../lib/pageViews'

export const dynamic = 'force-dynamic'

/** Admin: all stored daily stories + comment/view counts, plus usage summary. */
export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || '120')
  const days = Number(searchParams.get('days') || '30')

  const [items, stats] = await Promise.all([
    listAdminArchive(limit),
    getAdminUsageStats(days),
  ])

  return NextResponse.json({ items, stats })
}
