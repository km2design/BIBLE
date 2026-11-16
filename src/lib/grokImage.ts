import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { DailyStory } from '../data/dailyStories'

const IMAGE_MODEL = 'grok-imagine-image-2.0'
export const DEFAULT_HERO_PATH = '/daily/default-hero.jpg'

/** ~$0.04/image (1k low) + $0.01 if using edit reference — once per day via cron. */
export const IMAGE_COST_NOTE =
  'xAI grok-imagine-image-2.0 · ~US$0.04–0.05 per day (one image with cron, not per page view)'

function buildPrompt(story: DailyStory): string {
  return [
    'Story-driven contemplative digital illustration, same vibe as a warm painterly devotion card:',
    'soft golden window light, sincere quiet mood, textured fabric, sepia-gold palette, high detail.',
    'Not a flat cartoon mascot; depict a human moment that expresses the wisdom of the story.',
    'Portrait orientation. Avoid large English text; a short handwritten Traditional Chinese phrase is OK if natural.',
    `Title: ${story.title}`,
    `Story: ${story.story}`,
    `Wisdom (${story.wisdomKind}): ${story.wisdom}`,
    `Verse mood: ${story.verseRef} — ${story.verse}`,
  ].join('\n')
}

async function loadDefaultHeroDataUrl(): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), 'public', 'daily', 'default-hero.jpg')
    const buf = await readFile(file)
    return `data:image/jpeg;base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

function decodeImagePayload(data: unknown): { mime: string; bytes: Buffer } | null {
  if (!data || typeof data !== 'object') return null
  const row = data as { b64_json?: string; url?: string }
  if (row.b64_json) {
    return { mime: 'image/jpeg', bytes: Buffer.from(row.b64_json, 'base64') }
  }
  return null
}

async function fetchUrlAsImage(url: string): Promise<{ mime: string; bytes: Buffer } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const mime = res.headers.get('content-type') || 'image/jpeg'
    const bytes = Buffer.from(await res.arrayBuffer())
    if (bytes.length < 1000) return null
    return { mime, bytes }
  } catch {
    return null
  }
}

/**
 * Generate one story illustration with xAI Imagine.
 * Prefers image edit with the designed default hero as style reference;
 * falls back to text-only generation; returns null on failure.
 */
export async function generateStoryImage(
  story: DailyStory,
  apiKey: string,
): Promise<{ mime: string; bytes: Buffer } | null> {
  const prompt = buildPrompt(story)
  const hero = await loadDefaultHeroDataUrl()

  if (hero) {
    const edit = await fetch('https://api.x.ai/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        image: { url: hero, type: 'image_url' },
        n: 1,
        aspect_ratio: '2:3',
        resolution: '1k',
        quality: 'low',
        response_format: 'b64_json',
      }),
    })
    if (edit.ok) {
      const json = (await edit.json()) as { data?: unknown[] }
      const decoded = decodeImagePayload(json.data?.[0])
      if (decoded) return decoded
    }
  }

  const gen = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      aspect_ratio: '2:3',
      resolution: '1k',
      quality: 'low',
      response_format: 'b64_json',
    }),
  })
  if (!gen.ok) return null
  const json = (await gen.json()) as { data?: Array<{ b64_json?: string; url?: string }> }
  const first = json.data?.[0]
  const decoded = decodeImagePayload(first)
  if (decoded) return decoded
  if (first?.url) return fetchUrlAsImage(first.url)
  return null
}

export function storyImagePublicUrl(date: string): string {
  return `/api/daily/image?date=${encodeURIComponent(date)}`
}
