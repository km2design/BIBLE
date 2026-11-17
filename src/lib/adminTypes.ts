/** Shared admin types safe for client + server imports (no DB). */

export type PublishMode = 'open' | 'approve_required'

export type AdminAppSettings = {
  /** Mode A `open`: grok/sample/draft go public on the day. Mode B `approve_required`: only approved. */
  publishMode: PublishMode
  /** When true, story create/cron may auto-generate images. Default false = manual GEN 圖. */
  autoGenImage: boolean
}

export const DEFAULT_ADMIN_SETTINGS: AdminAppSettings = {
  publishMode: 'open',
  autoGenImage: false,
}

export type WeekStoryItem = {
  date: string
  title: string
  source: string
  hasImage: boolean
  imageUrl: string
  approved: boolean
}
