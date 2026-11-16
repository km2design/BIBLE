export type BgmId =
  | 'dawn'
  | 'lake'
  | 'stars'
  | 'glow'
  | 'hills'
  | 'hope'
  | 'rest'
  | 'grace'
  | 'pilgrim'
  | 'void'

export type NatureId =
  | 'none'
  | 'rain'
  | 'forest'
  | 'birds'
  | 'stream'
  | 'sea'
  | 'wind'
  | 'night'

export type BgmPreset = {
  id: BgmId
  label: string
  desc: string
  src: string
}

export type NaturePreset = {
  id: NatureId
  label: string
  desc: string
  src?: string
}

export const bgmPresets: BgmPreset[] = [
  { id: 'dawn', label: '晨曦', desc: '溫暖破曉襯底', src: '/audio/bgm/dawn.mp3' },
  { id: 'lake', label: '寧靜湖', desc: '柔和的大調和弦', src: '/audio/bgm/lake.mp3' },
  { id: 'stars', label: '深夜星', desc: '稀疏低頻星光', src: '/audio/bgm/stars.mp3' },
  { id: 'glow', label: '柔光', desc: '輕盈五度漂浮', src: '/audio/bgm/glow.mp3' },
  { id: 'hills', label: '遠山', desc: '緩慢長音襯景', src: '/audio/bgm/hills.mp3' },
  { id: 'hope', label: '盼望', desc: '微微上揚的氣息', src: '/audio/bgm/hope.mp3' },
  { id: 'rest', label: '安息', desc: '極柔小調安息', src: '/audio/bgm/rest.mp3' },
  { id: 'grace', label: '恩典', desc: '溫暖七和弦', src: '/audio/bgm/grace.mp3' },
  { id: 'pilgrim', label: '朝聖', desc: '緩步前行的節奏', src: '/audio/bgm/pilgrim.mp3' },
  { id: 'void', label: '空境', desc: '極簡空靈餘韻', src: '/audio/bgm/void.mp3' },
]

export const naturePresets: NaturePreset[] = [
  { id: 'none', label: '無', desc: '關閉環境聲' },
  { id: 'rain', label: '雨', desc: '細雨沙沙', src: '/audio/nature/rain.mp3' },
  { id: 'forest', label: '森林', desc: '林間氛圍', src: '/audio/nature/forest.mp3' },
  { id: 'birds', label: '鳥', desc: '公園鳥鳴', src: '/audio/nature/birds.mp3' },
  { id: 'stream', label: '溪流', desc: '流水潺潺', src: '/audio/nature/stream.mp3' },
  { id: 'sea', label: '海邊', desc: '潮汐浪聲', src: '/audio/nature/sea.mp3' },
  { id: 'wind', label: '風', desc: '輕柔風聲', src: '/audio/nature/wind.mp3' },
  { id: 'night', label: '夜蟲', desc: '蟋蟀蟲鳴', src: '/audio/nature/night.mp3' },
]

export const DEFAULT_BGM: BgmId = 'dawn'
export const DEFAULT_NATURE: NatureId = 'none'

/** Map legacy synthetic IDs saved in localStorage to current presets. */
export function normalizeNatureId(id: string | undefined | null): NatureId {
  const valid = new Set(naturePresets.map((p) => p.id))
  if (id && valid.has(id as NatureId)) return id as NatureId
  const legacy: Record<string, NatureId> = {
    drops: 'stream',
    meadow: 'birds',
  }
  if (id && legacy[id]) return legacy[id]
  return DEFAULT_NATURE
}
