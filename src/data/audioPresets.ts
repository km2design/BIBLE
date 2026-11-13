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
  | 'wind'
  | 'birds'
  | 'drops'
  | 'forest'
  | 'sea'
  | 'rain'
  | 'stream'
  | 'night'
  | 'meadow'

export type BgmPreset = {
  id: BgmId
  label: string
  desc: string
  freqs: number[]
  type: OscillatorType
  lfo: number
}

export type NaturePreset = {
  id: NatureId
  label: string
  desc: string
}

export const bgmPresets: BgmPreset[] = [
  { id: 'dawn', label: '晨曦', desc: '溫暖破曉襯底', freqs: [110, 164.81, 196, 246.94], type: 'sine', lfo: 0.08 },
  { id: 'lake', label: '寧靜湖', desc: '柔和的大調和弦', freqs: [130.81, 164.81, 196, 261.63], type: 'sine', lfo: 0.06 },
  { id: 'stars', label: '深夜星', desc: '稀疏低頻星光', freqs: [82.41, 123.47, 164.81], type: 'triangle', lfo: 0.04 },
  { id: 'glow', label: '柔光', desc: '輕盈五度漂浮', freqs: [146.83, 220, 293.66], type: 'sine', lfo: 0.1 },
  { id: 'hills', label: '遠山', desc: '緩慢長音襯景', freqs: [98, 147, 196, 233.08], type: 'triangle', lfo: 0.05 },
  { id: 'hope', label: '盼望', desc: '微微上揚的氣息', freqs: [123.47, 185, 246.94, 369.99], type: 'sine', lfo: 0.09 },
  { id: 'rest', label: '安息', desc: '極柔小調安息', freqs: [103.83, 155.56, 207.65], type: 'sine', lfo: 0.03 },
  { id: 'grace', label: '恩典', desc: '溫暖七和弦', freqs: [130.81, 196, 246.94, 311.13], type: 'sine', lfo: 0.07 },
  { id: 'pilgrim', label: '朝聖', desc: '緩步前行的節奏', freqs: [110, 146.83, 220, 329.63], type: 'triangle', lfo: 0.12 },
  { id: 'void', label: '空境', desc: '極簡空靈餘韻', freqs: [87.31, 174.61], type: 'sine', lfo: 0.02 },
]

export const naturePresets: NaturePreset[] = [
  { id: 'none', label: '無', desc: '關閉環境聲' },
  { id: 'wind', label: '風', desc: '輕柔風聲' },
  { id: 'birds', label: '鳥', desc: '遠處鳥鳴' },
  { id: 'drops', label: '水滴', desc: '緩慢水滴' },
  { id: 'forest', label: '森林', desc: '林間風與鳥' },
  { id: 'sea', label: '海邊', desc: '潮汐浪聲' },
  { id: 'rain', label: '雨', desc: '細雨沙沙' },
  { id: 'stream', label: '溪流', desc: '潺潺流水' },
  { id: 'night', label: '夜蟲', desc: '夜間蟲鳴' },
  { id: 'meadow', label: '草地', desc: '開闊草原風' },
]

export const DEFAULT_BGM: BgmId = 'dawn'
export const DEFAULT_NATURE: NatureId = 'none'
