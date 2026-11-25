import {
  DAILY_ARCHIVE_START,
  addDaysKey,
  dateKey,
  getSampleStoryForDate,
  weekDatesFrom,
  type DailyStory,
  type WisdomKind,
} from '../data/dailyStories'
import { getAdminSettings, isPublicSource, saveAdminSettings } from './adminSettings'
import type { PublishMode, WeekStoryItem } from './adminTypes'

/** One-shot key: purge stale public samples and lock Mode B from this date. */
export const PUBLIC_SYNC_FROM_DATE = '2026-11-18'
const PUBLIC_SYNC_SETTINGS_KEY = 'public_sync_v1'

/** Pre-茶記 doll ids that must not remain as public approved street content. */
const STALE_CAST_IDS = new Set([
  'anan',
  'xiaoguang',
  'lvren',
  'shouwang',
  'rouxin',
  'mingyan',
])

const STALE_STORY_MARKERS = ['大家面前總是微笑', '私底下卻很累']
import { buildChajiTextUserPrompt, CHAJI_TEXT_SYSTEM } from './chajiPrompt'
import { sql } from './db'
import {
  DEFAULT_HERO_PATH,
  generateStoryImage,
  storyImagePublicUrl,
} from './grokImage'

const KINDS: WisdomKind[] = ['反思', '名言', '提醒', '警告', '勸戒', '鼓勵', '安慰', '同理']

/** Current xAI chat model (grok-2-latest retired 2026-10-14). */
const GROK_MODEL = 'grok-4.7'

type GrokJson = {
  title?: string
  story?: string
  verseRef?: string
  verse?: string
  wisdomKind?: string
  wisdom?: string
  devotionTitle?: string
  devotion?: string
  prayer?: string
  characterId?: string
}

type CacheRow = {
  payload: DailyStory | string
  source: string
  has_image?: boolean
}

export type DailyHistoryItem = {
  date: string
  title: string
  wisdomKind: WisdomKind | string
  source: string
  imageUrl: string
}

function parsePayload(raw: DailyStory | string): DailyStory | null {
  try {
    const value = typeof raw === 'string' ? (JSON.parse(raw) as DailyStory) : raw
    if (!value || typeof value !== 'object' || !value.title) return null
    return value
  } catch {
    return null
  }
}

function withImageUrl(story: DailyStory, hasImage: boolean): DailyStory {
  return {
    ...story,
    imageUrl: hasImage ? storyImagePublicUrl(story.date) : DEFAULT_HERO_PATH,
  }
}

async function readCache(date: string): Promise<{ story: DailyStory; source: string } | null> {
  try {
    const rows = await sql<CacheRow>(
      `select payload, source, (image_bytes is not null) as has_image
       from daily_stories where story_date = $1::date`,
      [date],
    )
    if (!rows[0]) return null
    const story = parsePayload(rows[0].payload)
    if (!story) return null
    return {
      story: withImageUrl({ ...story, date }, Boolean(rows[0].has_image)),
      source: rows[0].source,
    }
  } catch {
    return null
  }
}

async function writeCache(date: string, story: DailyStory, source: string): Promise<void> {
  try {
    await sql(
      `insert into daily_stories (story_date, payload, source)
       values ($1::date, $2::jsonb, $3)
       on conflict (story_date) do nothing`,
      [date, JSON.stringify({ ...story, date, sample: source === 'sample', imageUrl: undefined }), source],
    )
  } catch {
    /* ignore cache write failures */
  }
}

/**
 * Claim the right to generate today's story.
 * Wins on empty day, or when upgrading a prior sample / stale pending lock.
 */
async function claimGenerationSlot(date: string): Promise<boolean> {
  try {
    await sql(
      `delete from daily_stories
       where story_date = $1::date
         and source = 'pending'
         and created_at < now() - interval '90 seconds'`,
      [date],
    )

    // Upgrade sample/draft so admin/cron can refresh unapproved text.
    const upgraded = await sql<{ story_date: string }>(
      `update daily_stories
       set payload = '{}'::jsonb, source = 'pending', created_at = now(),
           image_mime = null, image_bytes = null
       where story_date = $1::date and source in ('sample', 'draft')
       returning story_date::text`,
      [date],
    )
    if (upgraded.length > 0) return true

    const rows = await sql<{ story_date: string }>(
      `insert into daily_stories (story_date, payload, source)
       values ($1::date, '{}'::jsonb, 'pending')
       on conflict (story_date) do nothing
       returning story_date::text`,
      [date],
    )
    return rows.length > 0
  } catch {
    return false
  }
}

async function finalizeCache(date: string, story: DailyStory, source: string): Promise<void> {
  try {
    await sql(
      `update daily_stories
       set payload = $2::jsonb, source = $3
       where story_date = $1::date`,
      [
        date,
        JSON.stringify({ ...story, date, sample: source === 'sample', imageUrl: undefined }),
        source,
      ],
    )
  } catch {
    /* ignore */
  }
}

async function hasStoredImage(date: string): Promise<boolean> {
  try {
    const rows = await sql<{ has_image: boolean }>(
      `select (image_bytes is not null) as has_image from daily_stories where story_date = $1::date`,
      [date],
    )
    return Boolean(rows[0]?.has_image)
  } catch {
    return false
  }
}

async function saveStoryImage(date: string, mime: string, bytes: Buffer): Promise<void> {
  await sql(
    `update daily_stories
     set image_mime = $2, image_bytes = $3
     where story_date = $1::date and source in ('grok', 'sample', 'approved', 'draft')`,
    [date, mime, bytes],
  )
}

/** Rows that hold finished text (may or may not be public depending on publish mode). */
function isFinishedSource(source: string): boolean {
  return (
    source === 'grok' ||
    source === 'sample' ||
    source === 'approved' ||
    source === 'draft'
  )
}

function writeSourceForMode(mode: PublishMode, kind: 'generated' | 'sample'): string {
  if (mode === 'approve_required') return 'draft'
  return kind === 'sample' ? 'sample' : 'grok'
}

/**
 * Once per day (cron): generate illustration if missing.
 * Never called from public page views.
 */
async function ensureStoryImage(
  date: string,
  story: DailyStory,
  apiKey: string | undefined,
  force = false,
): Promise<boolean> {
  if (!force && (await hasStoredImage(date))) return false
  if (!apiKey) return false
  try {
    const image = await generateStoryImage(story, apiKey)
    if (!image) return false
    await saveStoryImage(date, image.mime, image.bytes)
    return true
  } catch {
    return false
  }
}

export async function storyHasImage(date: string): Promise<boolean> {
  return hasStoredImage(date)
}

export function adminImagePreviewUrl(date: string, bust?: number): string {
  const q = bust ? `&t=${bust}` : ''
  return `/api/admin/story/image?date=${encodeURIComponent(date)}${q}`
}

async function callGrok(date: string, apiKey: string): Promise<DailyStory | null> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      temperature: 0.85,
      messages: [
        { role: 'system', content: CHAJI_TEXT_SYSTEM },
        { role: 'user', content: buildChajiTextUserPrompt(date, KINDS) },
      ],
    }),
  })

  if (!res.ok) return null
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = data.choices?.[0]?.message?.content ?? ''
  const fenced = raw.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()
  const matched = fenced.match(/\{[\s\S]*\}/)
  const jsonText = matched ? matched[0] : fenced
  let parsed: GrokJson
  try {
    parsed = JSON.parse(jsonText) as GrokJson
  } catch {
    return null
  }
  const kind = (KINDS.includes(parsed.wisdomKind as WisdomKind)
    ? parsed.wisdomKind
    : '反思') as WisdomKind

  return {
    date,
    characterId: parsed.characterId || 'siuyau',
    title: parsed.title || '茶記今日',
    story: parsed.story || '',
    verseRef: parsed.verseRef || '詩篇 23:1',
    verse: parsed.verse || '耶和華是我的牧者，我必不致缺乏。',
    wisdomKind: kind,
    wisdom: parsed.wisdom || '',
    devotionTitle: parsed.devotionTitle || '今日默想',
    devotion: parsed.devotion || '',
    prayer: parsed.prayer || '主啊，求祢引導我的心。阿們。',
    sample: false,
  }
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * Public-safe daily story loader (no paid generation):
 * - Mode A: serves grok/sample/approved/draft; else ephemeral sample
 * - Mode B: serves approved only; else unavailable (no sample/grok street)
 */
export async function getDailyStory(
  date: string,
): Promise<{ story: DailyStory | null; source: string; unavailable?: boolean }> {
  const today = dateKey()
  const safeDate = isIsoDate(date) ? date : today
  // Public path must not run DB cutover/sync — that stays on cron / admin only.
  const { publishMode } = await getAdminSettings()

  const cached = await readCache(safeDate)
  if (cached && isPublicSource(cached.source, publishMode)) return cached

  if (cached?.source === 'pending') {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 250))
      const again = await readCache(safeDate)
      if (again && isPublicSource(again.source, publishMode)) return again
    }
  }

  if (publishMode === 'approve_required') {
    return { story: null, source: 'awaiting-approval', unavailable: true }
  }

  return {
    story: withImageUrl(getSampleStoryForDate(safeDate), false),
    source: 'sample',
  }
}

/**
 * Load a finished archived story only (no ephemeral sample inventing for missing days).
 */
export async function getArchivedStory(
  date: string,
): Promise<{ story: DailyStory; source: string } | null> {
  if (!isIsoDate(date)) return null
  const { publishMode } = await getAdminSettings()
  const cached = await readCache(date)
  if (!cached || !isPublicSource(cached.source, publishMode)) return null
  return cached
}

export async function listDailyHistory(limit = 60): Promise<DailyHistoryItem[]> {
  const capped = Math.min(Math.max(limit, 1), 90)
  const { publishMode } = await getAdminSettings()
  try {
    const rows = await sql<{
      date: string
      payload: DailyStory | string
      source: string
      has_image: boolean
    }>(
      `select story_date::text as date, payload, source,
              (image_bytes is not null) as has_image
       from daily_stories
       where source in ('grok', 'sample', 'approved', 'draft')
         and story_date >= $2::date
         and story_date <= $3::date
       order by story_date desc
       limit $1`,
      [capped, DAILY_ARCHIVE_START, dateKey()],
    )
    const items: DailyHistoryItem[] = []
    for (const row of rows) {
      if (!isPublicSource(row.source, publishMode)) continue
      const story = parsePayload(row.payload)
      if (!story) continue
      items.push({
        date: row.date,
        title: story.title,
        wisdomKind: story.wisdomKind,
        source: row.source,
        imageUrl: row.has_image ? storyImagePublicUrl(row.date) : DEFAULT_HERO_PATH,
      })
    }
    return items
  } catch {
    return []
  }
}

export async function getStoryImage(
  date: string,
  opts?: { admin?: boolean },
): Promise<{ mime: string; bytes: Buffer } | null> {
  if (!isIsoDate(date)) return null
  try {
    const rows = await sql<{
      image_mime: string | null
      image_bytes: Buffer | Uint8Array | null
      source: string
    }>(
      `select image_mime, image_bytes, source from daily_stories
       where story_date = $1::date and image_bytes is not null`,
      [date],
    )
    const row = rows[0]
    if (!row?.image_bytes) return null
    if (!opts?.admin) {
      const { publishMode } = await getAdminSettings()
      if (!isPublicSource(row.source, publishMode)) return null
    }
    const bytes = Buffer.isBuffer(row.image_bytes)
      ? row.image_bytes
      : Buffer.from(row.image_bytes)
    return { mime: row.image_mime || 'image/jpeg', bytes }
  } catch {
    return null
  }
}

/**
 * Cron-only: generate or upgrade today's story with Grok (once per day),
 * then generate one story illustration if missing.
 */
export async function ensureTodayStory(): Promise<{
  date: string
  source: string
  created: boolean
  imageGenerated: boolean
  title: string
}> {
  return ensureStoryForDate(dateKey())
}

/**
 * Generate or upgrade a specific calendar day's story (cron / admin day-ahead).
 * Does not overwrite admin-approved (or Mode A grok) rows unless they still need an image
 * and auto-gen image is enabled.
 */
export async function ensureStoryForDate(date: string): Promise<{
  date: string
  source: string
  created: boolean
  imageGenerated: boolean
  title: string
}> {
  if (!isIsoDate(date)) {
    return { date, source: 'sample', created: false, imageGenerated: false, title: '' }
  }

  const apiKey = process.env.XAI_API_KEY?.trim()
  const settings = await getAdminSettings()
  const before = await readCache(date)

  async function maybeImage(story: DailyStory, force = false): Promise<boolean> {
    if (!settings.autoGenImage && !force) return false
    return ensureStoryImage(date, story, apiKey, force)
  }

  if (before && (before.source === 'approved' || before.source === 'grok')) {
    const imageGenerated = await maybeImage(before.story)
    const refreshed = await readCache(date)
    return {
      date,
      source: before.source,
      created: false,
      imageGenerated,
      title: refreshed?.story.title ?? before.story.title,
    }
  }

  if (!apiKey) {
    const sample = getSampleStoryForDate(date)
    const source = writeSourceForMode(settings.publishMode, 'sample')
    if (!before || before.source === 'pending') {
      if (before?.source === 'pending') await finalizeCache(date, sample, source)
      else await writeCache(date, sample, source)
    }
    return {
      date,
      source,
      created: !before || before.source === 'pending',
      imageGenerated: false,
      title: sample.title,
    }
  }

  const claimed = await claimGenerationSlot(date)
  if (!claimed) {
    const existing = await readCache(date)
    if (existing && existing.source !== 'pending') {
      const imageGenerated = await maybeImage(existing.story)
      return {
        date,
        source: existing.source,
        created: false,
        imageGenerated,
        title: existing.story.title,
      }
    }
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 500))
      const again = await readCache(date)
      if (again && again.source !== 'pending') {
        const imageGenerated = await maybeImage(again.story)
        return {
          date,
          source: again.source,
          created: again.source === 'grok' || again.source === 'draft',
          imageGenerated,
          title: again.story.title,
        }
      }
    }
    const sample = getSampleStoryForDate(date)
    return {
      date,
      source: writeSourceForMode(settings.publishMode, 'sample'),
      created: false,
      imageGenerated: false,
      title: sample.title,
    }
  }

  try {
    const generated = await callGrok(date, apiKey)
    if (!generated) {
      const sample = getSampleStoryForDate(date)
      const source = writeSourceForMode(settings.publishMode, 'sample')
      await finalizeCache(date, sample, source)
      const imageGenerated = await maybeImage(sample)
      return { date, source, created: true, imageGenerated, title: sample.title }
    }
    const source = writeSourceForMode(settings.publishMode, 'generated')
    await finalizeCache(date, generated, source)
    const imageGenerated = await maybeImage(generated)
    return { date, source, created: true, imageGenerated, title: generated.title }
  } catch {
    const sample = getSampleStoryForDate(date)
    const source = writeSourceForMode(settings.publishMode, 'sample')
    await finalizeCache(date, sample, source)
    return { date, source, created: true, imageGenerated: false, title: sample.title }
  }
}

/** Admin: load a day including drafts that are not yet public (e.g. tomorrow). */
export async function getAdminStory(
  date: string,
): Promise<{ story: DailyStory; source: string; hasImage: boolean } | null> {
  if (!isIsoDate(date)) return null
  const cached = await readCache(date)
  const hasImage = await hasStoredImage(date)
  if (cached && cached.source !== 'pending') {
    return {
      ...cached,
      hasImage,
      story: {
        ...cached.story,
        imageUrl: hasImage ? adminImagePreviewUrl(date) : DEFAULT_HERO_PATH,
      },
    }
  }
  return {
    story: withImageUrl(getSampleStoryForDate(date), false),
    source: 'sample-ephemeral',
    hasImage: false,
  }
}

const EDITABLE_FIELDS = [
  'title',
  'story',
  'verseRef',
  'verse',
  'wisdomKind',
  'wisdom',
  'devotionTitle',
  'devotion',
  'prayer',
] as const

export type AdminStoryPatch = Partial<Pick<DailyStory, (typeof EDITABLE_FIELDS)[number]>>

/**
 * Admin save: upsert today's or tomorrow's story as approved.
 * Public site serves approved content once the calendar day is reached.
 */
export async function saveApprovedStory(
  date: string,
  patch: AdminStoryPatch,
): Promise<{ story: DailyStory; source: string }> {
  if (!isIsoDate(date)) throw new Error('invalid date')
  const existing = await readCache(date)
  const base =
    existing && existing.source !== 'pending'
      ? existing.story
      : getSampleStoryForDate(date)

  const kind = (
    patch.wisdomKind && KINDS.includes(patch.wisdomKind as WisdomKind)
      ? patch.wisdomKind
      : base.wisdomKind
  ) as WisdomKind

  const next: DailyStory = {
    ...base,
    date,
    title: (patch.title ?? base.title).trim() || base.title,
    story: (patch.story ?? base.story).trim() || base.story,
    verseRef: (patch.verseRef ?? base.verseRef).trim() || base.verseRef,
    verse: (patch.verse ?? base.verse).trim() || base.verse,
    wisdomKind: kind,
    wisdom: (patch.wisdom ?? base.wisdom).trim() || base.wisdom,
    devotionTitle: (patch.devotionTitle ?? base.devotionTitle).trim() || base.devotionTitle,
    devotion: (patch.devotion ?? base.devotion).trim() || base.devotion,
    prayer: (patch.prayer ?? base.prayer).trim() || base.prayer,
    sample: false,
  }

  await sql(
    `insert into daily_stories (story_date, payload, source)
     values ($1::date, $2::jsonb, 'approved')
     on conflict (story_date) do update
       set payload = excluded.payload, source = 'approved'`,
    [date, JSON.stringify({ ...next, imageUrl: undefined })],
  )

  const saved = await readCache(date)
  return saved ?? { story: withImageUrl(next, false), source: 'approved' }
}

/** Admin may edit today through today+6 (one week window). */
export function isAdminEditableDate(date: string): boolean {
  if (!isIsoDate(date)) return false
  const today = dateKey()
  const end = addDaysKey(today, 6)
  return date >= today && date <= end
}

export type { WeekStoryItem }

export async function listWeekStories(start = dateKey()): Promise<WeekStoryItem[]> {
  const dates = weekDatesFrom(start)
  const items: WeekStoryItem[] = []
  for (const date of dates) {
    const row = await getAdminStory(date)
    const source = row?.source || 'empty'
    items.push({
      date,
      title: row?.story.title || '（尚未生成）',
      source,
      hasImage: Boolean(row?.hasImage),
      imageUrl: row?.hasImage ? adminImagePreviewUrl(date) : DEFAULT_HERO_PATH,
      approved: source === 'approved',
    })
  }
  return items
}

/** Pre-generate text (and optional auto image) for a 7-day window. */
export async function ensureWeekStories(start = dateKey()): Promise<{
  start: string
  results: Awaited<ReturnType<typeof ensureStoryForDate>>[]
  items: WeekStoryItem[]
}> {
  const dates = weekDatesFrom(start)
  const results = []
  for (const date of dates) {
    results.push(await ensureStoryForDate(date))
  }
  return { start, results, items: await listWeekStories(start) }
}

/**
 * Persist current editor text without flipping an approved row back to sample.
 * Used before regenerating an illustration from edited copy.
 */
export async function saveEditorStory(
  date: string,
  patch: AdminStoryPatch,
): Promise<{ story: DailyStory; source: string }> {
  if (!isIsoDate(date)) throw new Error('invalid date')
  const existing = await readCache(date)
  const base =
    existing && existing.source !== 'pending'
      ? existing.story
      : getSampleStoryForDate(date)

  const kind = (
    patch.wisdomKind && KINDS.includes(patch.wisdomKind as WisdomKind)
      ? patch.wisdomKind
      : base.wisdomKind
  ) as WisdomKind

  const next: DailyStory = {
    ...base,
    date,
    title: (patch.title ?? base.title).trim() || base.title,
    story: (patch.story ?? base.story).trim() || base.story,
    verseRef: (patch.verseRef ?? base.verseRef).trim() || base.verseRef,
    verse: (patch.verse ?? base.verse).trim() || base.verse,
    wisdomKind: kind,
    wisdom: (patch.wisdom ?? base.wisdom).trim() || base.wisdom,
    devotionTitle: (patch.devotionTitle ?? base.devotionTitle).trim() || base.devotionTitle,
    devotion: (patch.devotion ?? base.devotion).trim() || base.devotion,
    prayer: (patch.prayer ?? base.prayer).trim() || base.prayer,
    sample: existing?.source === 'sample',
  }

  const settings = await getAdminSettings()
  const source =
    existing?.source === 'approved' || existing?.source === 'grok'
      ? existing.source
      : existing?.source === 'draft'
        ? 'draft'
        : writeSourceForMode(settings.publishMode, 'sample')

  await sql(
    `insert into daily_stories (story_date, payload, source)
     values ($1::date, $2::jsonb, $3)
     on conflict (story_date) do update
       set payload = excluded.payload,
           source = case
             when daily_stories.source in ('approved', 'grok') then daily_stories.source
             else excluded.source
           end`,
    [date, JSON.stringify({ ...next, imageUrl: undefined }), source],
  )

  const saved = await readCache(date)
  return saved ?? { story: withImageUrl(next, false), source }
}

export type PublicSyncReport = {
  fromDate: string
  publishMode: PublishMode
  cleared: { date: string; source: string; title: string }[]
  refreshed: { date: string; title: string; reason: string }[]
  approvedPublic: { date: string; title: string; characterId: string }[]
  draftsKept: { date: string; title: string }[]
  promoted?: { date: string; title: string }[]
}

function isStaleStreetPayload(story: DailyStory): boolean {
  const id = (story.characterId || '').trim().toLowerCase()
  if (STALE_CAST_IDS.has(id)) return true
  const body = story.story || ''
  return STALE_STORY_MARKERS.some((m) => body.includes(m))
}

/**
 * Mode B + remove non-approved public street rows from `fromDate` onward.
 * Refreshes stale pre-茶記 approved payloads (old doll cast / formal sample)
 * to the current Cantonese sample while keeping `approved` so the front stays live.
 * Optionally promotes remaining drafts to approved (Admin 「核准並同步」).
 */
export async function syncPublicFromApproved(
  fromDate = PUBLIC_SYNC_FROM_DATE,
  opts?: { promoteDrafts?: boolean },
): Promise<PublicSyncReport> {
  if (!isIsoDate(fromDate)) throw new Error('invalid date')

  const settings = await saveAdminSettings({ publishMode: 'approve_required' })

  const rows = await sql<{
    date: string
    payload: DailyStory | string
    source: string
  }>(
    `select story_date::text as date, payload, source
     from daily_stories
     where story_date >= $1::date
     order by story_date asc`,
    [fromDate],
  )

  const cleared: PublicSyncReport['cleared'] = []
  const refreshed: PublicSyncReport['refreshed'] = []
  const promoted: PublicSyncReport['promoted'] = []

  for (const row of rows) {
    const story = parsePayload(row.payload)
    const title = story?.title || '（無標題）'

    if (row.source === 'sample' || row.source === 'grok' || row.source === 'pending') {
      await sql(`delete from daily_stories where story_date = $1::date`, [row.date])
      cleared.push({ date: row.date, source: row.source, title })
      continue
    }

    if (
      (row.source === 'approved' || row.source === 'draft') &&
      story &&
      isStaleStreetPayload(story)
    ) {
      const next = {
        ...getSampleStoryForDate(row.date),
        date: row.date,
        sample: false,
      }
      await sql(
        `update daily_stories
         set payload = $2::jsonb,
             source = $3,
             image_mime = null,
             image_bytes = null
         where story_date = $1::date`,
        [row.date, JSON.stringify({ ...next, imageUrl: undefined }), row.source],
      )
      refreshed.push({
        date: row.date,
        title: next.title,
        reason: `stale:${story.characterId || 'unknown'}→${next.characterId}`,
      })
    }
  }

  if (opts?.promoteDrafts) {
    const drafts = await sql<{ date: string; payload: DailyStory | string }>(
      `select story_date::text as date, payload from daily_stories
       where story_date >= $1::date and source = 'draft'
       order by story_date asc`,
      [fromDate],
    )
    for (const row of drafts) {
      await sql(
        `update daily_stories set source = 'approved' where story_date = $1::date`,
        [row.date],
      )
      const story = parsePayload(row.payload)
      promoted.push({ date: row.date, title: story?.title || '（無標題）' })
    }
  }

  const remaining = await sql<{
    date: string
    payload: DailyStory | string
    source: string
  }>(
    `select story_date::text as date, payload, source
     from daily_stories
     where story_date >= $1::date
       and source in ('approved', 'draft')
     order by story_date asc`,
    [fromDate],
  )

  const approvedPublic: PublicSyncReport['approvedPublic'] = []
  const draftsKept: PublicSyncReport['draftsKept'] = []
  for (const row of remaining) {
    const story = parsePayload(row.payload)
    const title = story?.title || '（無標題）'
    if (row.source === 'approved') {
      approvedPublic.push({
        date: row.date,
        title,
        characterId: story?.characterId || '',
      })
    } else {
      draftsKept.push({ date: row.date, title })
    }
  }

  return {
    fromDate,
    publishMode: settings.publishMode,
    cleared,
    refreshed,
    approvedPublic,
    draftsKept,
    ...(opts?.promoteDrafts ? { promoted } : {}),
  }
}

/** Run syncPublicFromApproved once per DB (idempotent via app_settings). */
export async function ensurePublicSyncOnce(
  fromDate = PUBLIC_SYNC_FROM_DATE,
): Promise<PublicSyncReport | null> {
  // Local PGlite (no DATABASE_URL) skips auto cutover so smoke/dev Mode A still works.
  if (!process.env.DATABASE_URL?.trim()) return null

  try {
    const existing = await sql<{ value: unknown }>(
      `select value from app_settings where key = $1`,
      [PUBLIC_SYNC_SETTINGS_KEY],
    )
    if (existing[0]) return null
  } catch {
    return null
  }

  const report = await syncPublicFromApproved(fromDate)
  await sql(
    `insert into app_settings (key, value, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (key) do update
       set value = excluded.value, updated_at = now()`,
    [
      PUBLIC_SYNC_SETTINGS_KEY,
      JSON.stringify({
        fromDate,
        appliedAt: new Date().toISOString(),
        cleared: report.cleared.map((c) => c.date),
        refreshed: report.refreshed.map((r) => r.date),
        approvedPublic: report.approvedPublic.map((a) => a.date),
      }),
    ],
  )
  return report
}

/**
 * Admin: generate or force-regenerate the day's illustration from story text.
 */
export async function regenerateAdminImage(
  date: string,
  patch?: AdminStoryPatch,
  force = true,
): Promise<{ generated: boolean; hasImage: boolean; reason?: string; story: DailyStory; source: string }> {
  if (!isIsoDate(date)) {
    throw new Error('invalid date')
  }

  let saved: { story: DailyStory; source: string }
  if (patch) {
    saved = await saveEditorStory(date, patch)
  } else {
    const row = await getAdminStory(date)
    saved = {
      story: row?.story ?? getSampleStoryForDate(date),
      source: row?.source === 'sample-ephemeral' ? 'sample' : row?.source || 'sample',
    }
    if (!row || row.source === 'sample-ephemeral') {
      saved = await saveEditorStory(date, saved.story)
    }
  }

  const apiKey = process.env.XAI_API_KEY?.trim()
  if (!apiKey) {
    return {
      generated: false,
      hasImage: await hasStoredImage(date),
      reason: '缺少 XAI_API_KEY，改顯示預設英雄圖',
      story: saved.story,
      source: saved.source,
    }
  }

  const generated = await ensureStoryImage(date, saved.story, apiKey, force)
  const hasImage = await hasStoredImage(date)
  return {
    generated,
    hasImage,
    reason: generated
      ? undefined
      : force
        ? '插畫生成失敗，請稍後再試'
        : '插畫已存在',
    story: {
      ...saved.story,
      imageUrl: hasImage ? adminImagePreviewUrl(date, Date.now()) : DEFAULT_HERO_PATH,
    },
    source: saved.source,
  }
}
