import type { DailyStory } from '../data/dailyStories'

/** Core cast + gospel guests for daily 茶記大作戰 voice. */
export const CHAJI_CAST_BRIEF = `
【核心角色（每日可出場，唔使齊人）】
- 林小悠：17歲女大學生，文青風（白恤衫＋啡蝴蝶結、啡格背心裙、米色針織開衫、啡樂福鞋）。溫柔有啲迷糊，常被兩隻貓整蠱但仍有耐性。
- 肥仔 Oreo／佈佈／阿 O：布偶貓，站立約50cm，肥、貪吃慵懶愛撒嬌愛扮型；紅白橫間 POLO、牛仔短褲、白波鞋紅間。
- 妹妹 Mochi／咪咪／阿 Mo：短腿貓，約45cm，活潑機靈毒舌吐槽；白恤衫＋紅白格蝴蝶結／百褶裙、白襪、紅瑪莉珍。

【福音之旅角色（可輪流出場，服務主題即可）】
耶穌（米白內袍＋深藍／紫色外袍）、彼得／安德烈、馬太、抹大拉的馬利亞、尼哥德慕、撒該、馬大／伯大尼馬利亞／拉撒路、該亞法、彼拉多、巴拉巴、生來瞎眼的等。互動要自然，唔好硬銷、唔好堆砌角色。
`.trim()

export const CHAJI_TEXT_SYSTEM = `
你係「茶記大作戰」每日繪卷編劇。用繁體字、以廣東話為主（可夾少少書面語同經文引用），寫香港人聽落似日常傾偈嘅短篇。
必須有本地特色（茶餐廳／街市／公園／港鐵／宿舍等）、貼近人心、有掙扎；可用幽默，但要有深度、反思、新角度。
讀完要令讀者對「今日自己嘅生命」有新眼光；絕對禁止空泛雞湯、模板勵志、AI 口吻、公仔代言牌口吻。
故事用場景敘事；角色用名（林小悠／Oreo／Mochi 等同福音角色），唔好寫「某某公仔說」。
輸出嚴格 JSON，唔好 markdown。
`.trim()

export function buildChajiTextUserPrompt(date: string, kinds: string[]): string {
  return [
    `日期 ${date}。寫一則「茶記大作戰」風每日繪卷。`,
    CHAJI_CAST_BRIEF,
    '要求：',
    '- 至少出場核心角色之一（林小悠／Oreo／Mochi）；可加一位福音角色若主題需要。',
    '- story：140–220字，廣東話場景故事，有衝突或掙扎，幽默可有，結局帶一句真實洞察（唔好講大道理口號）。',
    `- wisdomKind 必須係 ${kinds.join('/')} 之一。`,
    '- wisdom：一句廣東話／口語智慧，有刺、有溫度，唔好似勵志海報。',
    '- verse／verseRef：和合本風格經文（可書面）；同故事主題咬合。',
    '- devotionTitle／devotion：兩句反思問題，貼近今日生活抉擇。',
    '- prayer：一句短禱告，口語自然。',
    '- characterId：用主要角色英文 id，例如 "siuyau" | "oreo" | "mochi" | "jesus" | "story"。',
    '- title：短、有畫面，唔好「今日靈修」呢類空標題。',
    'JSON 欄位：title, story, verseRef, verse, wisdomKind, wisdom, devotionTitle, devotion, prayer, characterId',
  ].join('\n')
}

export function buildChajiImagePrompt(story: DailyStory): string {
  return [
    'High-quality 3D animated feature-film still in the exact visual language of 「茶記大作戰」:',
    'plush anthropomorphic cats with detailed fur, Hong Kong cha chaan teng / wet market / park atmosphere,',
    'warm cinematic lighting, nostalgic mosaic tiles or local street detail, expressive faces, no flat 2D mascot,',
    'no green hooded proverb doll, no quote-mirror composition.',
    'Portrait orientation 2:3. Prefer no large English text; short Traditional Chinese on a menu/sign is OK if natural.',
    'Match the reference images for character design and 3D style.',
    '',
    'Core look reminders:',
    '- 林小悠: long black hair with bangs, white shirt + brown bow, brown plaid pinafore, beige cardigan, brown loafers',
    '- Oreo: chubby ragdoll cat ~50cm standing, red-white striped polo with 香港 patch, denim shorts, white sneakers with red stripes',
    '- Mochi: grey-white short-legged cat ~45cm, white shirt, red plaid bow + skirt, white socks, red Mary Janes',
    '',
    `Title: ${story.title}`,
    `Scene to depict: ${story.story}`,
    `Mood / wisdom: ${story.wisdomKind} — ${story.wisdom}`,
    `Verse mood: ${story.verseRef}`,
  ].join('\n')
}

/** Preferred local paths for style/character consistency (under public/). */
export const CHAJI_IMAGE_REF_PATHS = [
  'public/chaji/style/tea-cast-poster.jpg',
  'public/chaji/cast/oreo-sheet.jpg',
  'public/chaji/cast/mochi-sheet.jpg',
  'public/chaji/cast/siuyau-sheet.jpg',
  'public/chaji/ep1-diet.jpg',
] as const
