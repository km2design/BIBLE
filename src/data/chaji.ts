export type ChajiSeriesId = 'main' | 'gospel'

export type ChajiEpisode = {
  id: string
  seriesId: ChajiSeriesId
  seriesTitle: string
  ep: number
  title: string
  subtitle: string
  cover: string
  blurb: string
}

export const CHAJI_INTRO =
  '林小悠帶著兩隻貓: 肥仔 Oreo 和咪咪 Mochi，走進一間充滿懷舊風味的香港傳統茶餐廳，享受一個溫馨的早餐時光。透過點餐、享用美食的互動，展現香港茶餐廳文化和人寵之間的深厚感情。'

export const chajiSeries: { id: ChajiSeriesId; title: string; tagline: string }[] = [
  {
    id: 'main',
    title: '茶記大作戰',
    tagline: '茶餐廳日常 · 人寵溫馨',
  },
  {
    id: 'gospel',
    title: '茶記大作戰 福音之旅',
    tagline: '時空之門 · 信仰旅程',
  },
]

export const chajiEpisodes: ChajiEpisode[] = [
  {
    id: 'chaji-ep1-diet',
    seriesId: 'main',
    seriesTitle: '茶記大作戰',
    ep: 1,
    title: '減肥大作戰',
    subtitle: '第一集',
    cover: '/chaji/ep1-diet.jpg',
    blurb: '茶記裡的美食香氣太誘人，減肥計劃會不會一開場就破功？肥仔 Oreo 與咪咪 Mochi 陪林小悠一起面對餐牌的考驗。',
  },
  {
    id: 'chaji-ep2-market',
    seriesId: 'main',
    seriesTitle: '茶記大作戰',
    ep: 2,
    title: '街市大冒險',
    subtitle: '第二集',
    cover: '/chaji/ep2-market.jpg',
    blurb: '走到街市買餸，人聲、攤檔與驚喜處處。兩隻貓與主人展開一場熱鬧的街頭小冒險。',
  },
  {
    id: 'chaji-ep3-picnic',
    seriesId: 'main',
    seriesTitle: '茶記大作戰',
    ep: 3,
    title: '公園野餐記',
    subtitle: '第三集',
    cover: '/chaji/ep3-picnic.jpg',
    blurb: '把茶記味道帶到公園草地，陽光、便當與陪伴，寫下一頁溫柔的野餐時光。',
  },
  {
    id: 'chaji-gospel-ep1-portal',
    seriesId: 'gospel',
    seriesTitle: '茶記大作戰 福音之旅',
    ep: 1,
    title: '時空之門',
    subtitle: '第一集',
    cover: '/chaji/gospel-ep1-portal.jpg',
    blurb: '一道意外開啟的時空之門，把茶記日常與福音旅程接上——冒險才剛開始。',
  },
]

export function getChajiEpisode(id: string): ChajiEpisode | undefined {
  return chajiEpisodes.find((e) => e.id === id)
}

export function episodesInSeries(seriesId: ChajiSeriesId): ChajiEpisode[] {
  return chajiEpisodes.filter((e) => e.seriesId === seriesId).sort((a, b) => a.ep - b.ep)
}

export function nextChajiEpisode(id: string): ChajiEpisode | undefined {
  const current = getChajiEpisode(id)
  if (!current) return undefined
  const list = episodesInSeries(current.seriesId)
  const i = list.findIndex((e) => e.id === id)
  if (i < 0 || i >= list.length - 1) return undefined
  return list[i + 1]
}
