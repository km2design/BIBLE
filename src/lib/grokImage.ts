import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { DailyStory } from '../data/dailyStories'
import { buildChajiImagePrompt, CHAJI_IMAGE_REF_PATHS } from './chajiPrompt'

const IMAGE_MODEL = 'grok-imagine-image-2.0'
export const DEFAULT_HERO_PATH = '/daily/default-hero.jpg'

/** ~$0.04/image (1k low) + refs via edit — once per day via cron / admin GEN. */
export const IMAGE_COST_NOTE =
  'xAI grok-imagine-image-2.0 · ~US$0.04–0.05 per day (one image with cron, not per page view)'

async function loadRefDataUrls(limit = 3): Promise<string[]> {
  const urls: string[] = []
  for (const rel of CHAJI_IMAGE_REF_PATHS) {
    if (urls.length >= limit) break
    try {
      const file = path.join(process.cwd(), rel)
      const buf = await readFile(file)
      if (buf.length < 1000) continue
      urls.push(`data:image/jpeg;base64,${buf.toString('base64')}`)
    } catch {
      /* skip missing ref */
    }
  }
  return urls
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
 * Generate one 茶記大作戰-style story illustration with xAI Imagine.
 * Prefers image edit with cast/style reference stills; falls back to text-only.
 */
export async function generateStoryImage(
  story: DailyStory,
  apiKey: string,
): Promise<{ mime: string; bytes: Buffer } | null> {
  const prompt = buildChajiImagePrompt(story)
  const refs = await loadRefDataUrls(3)

  if (refs.length > 0) {
    // Primary: style poster + optional cast sheets for character lock.
    const imageField =
      refs.length === 1
        ? { url: refs[0], type: 'image_url' }
        : refs.map((url) => ({ url, type: 'image_url' as const }))

    const edit = await fetch('https://api.x.ai/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        image: imageField,
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

    // Some API shapes only accept a single image — retry with first ref.
    if (refs.length > 1) {
      const single = await fetch('https://api.x.ai/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt,
          image: { url: refs[0], type: 'image_url' },
          n: 1,
          aspect_ratio: '2:3',
          resolution: '1k',
          quality: 'low',
          response_format: 'b64_json',
        }),
      })
      if (single.ok) {
        const json = (await single.json()) as { data?: unknown[] }
        const decoded = decodeImagePayload(json.data?.[0])
        if (decoded) return decoded
      }
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
