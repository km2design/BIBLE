import { getSampleStoryForDate, type DailyStory, type WisdomKind } from '../data/dailyStories'
import { characters } from '../data/characters'

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

export async function getDailyStory(date: string): Promise<DailyStory> {
  const key = process.env.XAI_API_KEY?.trim()
  if (!key) return getSampleStoryForDate(date)

  try {
    const character = characters[Math.floor(Math.random() * characters.length)]
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
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

    if (!res.ok) return getSampleStoryForDate(date)
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
  } catch {
    return getSampleStoryForDate(date)
  }
}
