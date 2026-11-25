import {
  DEFAULT_ADMIN_SETTINGS,
  type AdminAppSettings,
  type PublishMode,
} from './adminTypes'
import { sql } from './db'

export type { AdminAppSettings, PublishMode }
export { DEFAULT_ADMIN_SETTINGS }

const SETTINGS_KEY = 'admin'

function parseSettings(raw: unknown): AdminAppSettings {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<AdminAppSettings>
  return {
    // Only explicit Mode A opts into open publish; anything else stays Mode B.
    publishMode: value.publishMode === 'open' ? 'open' : 'approve_required',
    autoGenImage: Boolean(value.autoGenImage),
  }
}

export async function getAdminSettings(): Promise<AdminAppSettings> {
  try {
    const rows = await sql<{ value: unknown }>(
      `select value from app_settings where key = $1`,
      [SETTINGS_KEY],
    )
    if (!rows[0]) return { ...DEFAULT_ADMIN_SETTINGS }
    return parseSettings(rows[0].value)
  } catch {
    return { ...DEFAULT_ADMIN_SETTINGS }
  }
}

export async function saveAdminSettings(
  patch: Partial<AdminAppSettings>,
): Promise<AdminAppSettings> {
  const current = await getAdminSettings()
  const next: AdminAppSettings = {
    publishMode:
      patch.publishMode === 'approve_required' || patch.publishMode === 'open'
        ? patch.publishMode
        : current.publishMode,
    autoGenImage:
      typeof patch.autoGenImage === 'boolean' ? patch.autoGenImage : current.autoGenImage,
  }

  await sql(
    `insert into app_settings (key, value, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key) do update
       set value = excluded.value, updated_at = now()`,
    [SETTINGS_KEY, JSON.stringify(next)],
  )

  return next
}

export function isPublicSource(source: string, mode: PublishMode): boolean {
  if (mode === 'approve_required') return source === 'approved'
  return source === 'grok' || source === 'sample' || source === 'approved' || source === 'draft'
}
