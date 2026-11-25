import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../../lib/adminAuth'
import {
  getAdminSettings,
  saveAdminSettings,
  type AdminAppSettings,
  type PublishMode,
} from '../../../../lib/adminSettings'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response
  const settings = await getAdminSettings()
  return NextResponse.json({ settings })
}

export async function PUT(request: Request) {
  const auth = requireAdmin(request)
  if (!auth.ok) return auth.response

  let body: Partial<AdminAppSettings> = {}
  try {
    body = (await request.json()) as Partial<AdminAppSettings>
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const patch: Partial<AdminAppSettings> = {}
  if (body.publishMode === 'open' || body.publishMode === 'approve_required') {
    patch.publishMode = body.publishMode as PublishMode
  }
  if (typeof body.autoGenImage === 'boolean') {
    patch.autoGenImage = body.autoGenImage
  }

  const settings = await saveAdminSettings(patch)
  return NextResponse.json({
    ok: true,
    settings,
    message:
      settings.publishMode === 'approve_required'
        ? '已切換：必須核准才公開'
        : '已切換：預產／生成後到日可公開（可不核准）',
  })
}
