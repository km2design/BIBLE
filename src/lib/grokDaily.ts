import { characters } from '../data/characters'
import {
  dateKey,
  getSampleStoryForDate,
  type DailyStory,
  type WisdomKind,
} from '../data/dailyStories'
import { sql } from './db'

const KINDS: WisdomKind[] = ['反思', '名言', '提醒', '警告', '勸戒', '鼓勵', '安慰', '同理']

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

async function readCache(date: string): Promise<{ story: DailyStory; source: string } | null> {
  try {
    const rows = await sql<CacheRow>(
      `select payload, source from daily_stories where story_date = $1::date`,
      [date],
    )
    if (!rows[0]) return null
    const story = parsePayload(rows[0].payload)
    if (!story) return null
    return { story: { ...story, date }, source: rows[0].source }
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
      [date, JSON.stringify({ ...story, date, sample: source === 'sample' }), source],
    )
  } catch {
    /* ignore cache write failures */
  }
}

/** Claim the right to generate today's story. Only one caller wins. */
async function claimGenerationSlot(date: string): Promise<boolean> {
  try {
    // Clear stale pending locks so a crashed generation cannot block the day.
    await sql(
      `delete from daily_stories
       where story_date = $1::date
         and source = 'pending'
         and created_at < now() - interval '45 seconds'`,
      [date],
    )
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
      [date, JSON.stringify({ ...story, date, sample: source === 'sample' }), source],
    )
  } catch {
    /* ignore */
  }
}

async function callGrok(date: string, apiKey: string): Promise<DailyStory | null> {
  const character = characters[Math.abs(hash(date)) % characters.length]
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-2-latest',
      temperature: 0.8,
      messages: [
        {
          role: 'system',
          content:
            '你是基督教靈修故事助手。用繁體中文寫短篇。不要直接重述整段福音故事，而是讓3D公仔角色在日常情境中讀經文、得著人生智慧。輸出嚴格 JSON，不要 markdown。',
        },
        {
          role: 'user',
          content: `日期 ${date}。角色：${character.name}（${character.title}，${character.trait}）。請輸出 JSON 欄位：title, story(120-180字), verseRef, verse(和合本風格一句至三句), wisdomKind(必須是 ${KINDS.join('/')} 之一), wisdom(一句), devotionTitle, devotion(兩句反思問題或默想), prayer(一句禱告), characterId("${character.id}")。`,
        },
      ],
    }),
  })

  if (!res.ok) return null
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const raw = data.choices?.[0]?.message?.content ?? ''
  const jsonText = raw.replace(/^```json\s*|\s*```$/g, '').trim()
  const parsed = JSON.parse(jsonText) as GrokJson
  const kind = (KINDS.includes(parsed.wisdomKind as WisdomKind)
    ? parsed.wisdomKind
    : '反思') as WisdomKind

  return {
    date,
    characterId: parsed.characterId || character.id,
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

function hash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0
  return h
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

/**
 * Public-safe daily story loader:
 * - Serves cache when present
 * - Never calls paid Grok for non-today dates
 * - Calls Grok at most once per date (DB claim slot)
 * - Falls back to sample content otherwise
 */
export async function getDailyStory(date: string): Promise<{ story: DailyStory; source: string }> {
  const today = dateKey()
  const safeDate = isIsoDate(date) ? date : today

  const cached = await readCache(safeDate)
  if (cached && cached.source !== 'pending') return cached

  // Past/future dates: sample only, no paid generation
  if (safeDate !== today) {
    return { story: getSampleStoryForDate(safeDate), source: 'sample' }
  }

  const apiKey = process.env.XAI_API_KEY?.trim()
  if (!apiKey) {
    const sample = getSampleStoryForDate(safeDate)
    await writeCache(safeDate, sample, 'sample')
    return { story: sample, source: 'sample' }
  }

  // Only one request may generate; others wait briefly then read cache/sample
  const claimed = cached?.source === 'pending' ? false : await claimGenerationSlot(safeDate)
  if (!claimed) {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 250))
      const again = await readCache(safeDate)
      if (again && again.source !== 'pending') return again
    }
    return { story: getSampleStoryForDate(safeDate), source: 'sample' }
  }

  try {
    const generated = await callGrok(safeDate, apiKey)
    if (!generated) {
      const sample = getSampleStoryForDate(safeDate)
      await finalizeCache(safeDate, sample, 'sample')
      return { story: sample, source: 'sample' }
    }
    await finalizeCache(safeDate, generated, 'grok')
    return { story: generated, source: 'grok' }
  } catch {
    const sample = getSampleStoryForDate(safeDate)
    await finalizeCache(safeDate, sample, 'sample')
    return { story: sample, source: 'sample' }
  }
}
