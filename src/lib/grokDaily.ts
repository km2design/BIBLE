import {
  DAILY_ARCHIVE_START,
  dateKey,
  getSampleStoryForDate,
  type DailyStory,
  type WisdomKind,
} from '../data/dailyStories'
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

    // Upgrade a sample row so a failed/early sample cache can become Grok later.
    const upgraded = await sql<{ story_date: string }>(
      `update daily_stories
       set payload = '{}'::jsonb, source = 'pending', created_at = now(),
           image_mime = null, image_bytes = null
       where story_date = $1::date and source = 'sample'
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
     where story_date = $1::date and source in ('grok', 'sample')`,
    [date, mime, bytes],
  )
}

/**
 * Once per day (cron): generate illustration if missing.
 * Never called from public page views.
 */
async function ensureStoryImage(
  date: string,
  story: DailyStory,
  apiKey: string | undefined,
): Promise<boolean> {
  if (await hasStoredImage(date)) return false
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

async function callGrok(date: string, apiKey: string): Promise<DailyStory | null> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            '你是基督教靈修文章助手。用繁體中文寫短篇日常情境故事（第三人稱或場景敘事），帶出經文與人生智慧。不要用公仔／吉祥物／角色名牌作為說話者；不要寫「某某公仔說」。輸出嚴格 JSON，不要 markdown。',
        },
        {
          role: 'user',
          content: `日期 ${date}。請輸出 JSON 欄位：title, story(120-180字，故事驅動、無公仔代言), verseRef, verse(和合本風格一句至三句), wisdomKind(必須是 ${KINDS.join('/')} 之一), wisdom(一句), devotionTitle, devotion(兩句反思問題或默想), prayer(一句禱告), characterId("story")。`,
        },
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
  const parsed = JSON.parse(jsonText) as GrokJson
  const kind = (KINDS.includes(parsed.wisdomKind as WisdomKind)
    ? parsed.wisdomKind
    : '反思') as WisdomKind

  return {
    date,
    characterId: parsed.characterId || 'story',
    title: parsed.title || '今日繪卷',
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
 * - Serves finished cache (grok or sample)
 * - Otherwise returns ephemeral sample without locking the day
 */
export async function getDailyStory(date: string): Promise<{ story: DailyStory; source: string }> {
  const today = dateKey()
  const safeDate = isIsoDate(date) ? date : today

  const cached = await readCache(safeDate)
  if (cached && cached.source !== 'pending') return cached

  if (cached?.source === 'pending') {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 250))
      const again = await readCache(safeDate)
      if (again && again.source !== 'pending') return again
    }
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
  const cached = await readCache(date)
  if (!cached || cached.source === 'pending') return null
  return cached
}

export async function listDailyHistory(limit = 60): Promise<DailyHistoryItem[]> {
  const capped = Math.min(Math.max(limit, 1), 90)
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
       where source in ('grok', 'sample')
         and story_date >= $2::date
       order by story_date desc
       limit $1`,
      [capped, DAILY_ARCHIVE_START],
    )
    const items: DailyHistoryItem[] = []
    for (const row of rows) {
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
): Promise<{ mime: string; bytes: Buffer } | null> {
  if (!isIsoDate(date)) return null
  try {
    const rows = await sql<{ image_mime: string | null; image_bytes: Buffer | Uint8Array | null }>(
      `select image_mime, image_bytes from daily_stories
       where story_date = $1::date and image_bytes is not null`,
      [date],
    )
    const row = rows[0]
    if (!row?.image_bytes) return null
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
  const date = dateKey()
  const apiKey = process.env.XAI_API_KEY?.trim()
  const before = await readCache(date)

  if (before && before.source === 'grok') {
    const imageGenerated = await ensureStoryImage(date, before.story, apiKey)
    const refreshed = await readCache(date)
    return {
      date,
      source: 'grok',
      created: false,
      imageGenerated,
      title: refreshed?.story.title ?? before.story.title,
    }
  }

  if (!apiKey) {
    const sample = getSampleStoryForDate(date)
    if (!before || before.source === 'pending') {
      if (before?.source === 'pending') await finalizeCache(date, sample, 'sample')
      else await writeCache(date, sample, 'sample')
    }
    return {
      date,
      source: 'sample',
      created: !before || before.source === 'pending',
      imageGenerated: false,
      title: sample.title,
    }
  }

  const claimed = await claimGenerationSlot(date)
  if (!claimed) {
    const existing = await readCache(date)
    if (existing && existing.source !== 'pending') {
      const imageGenerated = await ensureStoryImage(date, existing.story, apiKey)
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
        const imageGenerated = await ensureStoryImage(date, again.story, apiKey)
        return {
          date,
          source: again.source,
          created: again.source === 'grok',
          imageGenerated,
          title: again.story.title,
        }
      }
    }
    const sample = getSampleStoryForDate(date)
    return {
      date,
      source: 'sample',
      created: false,
      imageGenerated: false,
      title: sample.title,
    }
  }

  try {
    const generated = await callGrok(date, apiKey)
    if (!generated) {
      const sample = getSampleStoryForDate(date)
      await finalizeCache(date, sample, 'sample')
      const imageGenerated = await ensureStoryImage(date, sample, apiKey)
      return { date, source: 'sample', created: true, imageGenerated, title: sample.title }
    }
    await finalizeCache(date, generated, 'grok')
    const imageGenerated = await ensureStoryImage(date, generated, apiKey)
    return { date, source: 'grok', created: true, imageGenerated, title: generated.title }
  } catch {
    const sample = getSampleStoryForDate(date)
    await finalizeCache(date, sample, 'sample')
    return { date, source: 'sample', created: true, imageGenerated: false, title: sample.title }
  }
}
