import { bgmPresets, type BgmId, type NatureId } from '../data/audioPresets'

type Stoppable = { stop: () => void }

function getAC(): typeof AudioContext {
  return window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
}

function makeNoiseBuffer(ctx: AudioContext, seconds = 2) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

export type AudioEngine = {
  resume: () => Promise<void>
  setMasterOn: (on: boolean) => void
  setBgm: (id: BgmId, enabled: boolean, volume: number) => void
  setNature: (id: NatureId, enabled: boolean, volume: number) => void
  setSfx: (enabled: boolean, volume: number) => void
  playSfx: (kind: 'scene' | 'tap' | 'devotion') => void
  dispose: () => void
}

export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let bgmBus: GainNode | null = null
  let natureBus: GainNode | null = null
  let sfxBus: GainNode | null = null

  let masterOn = true
  let bgmEnabled = true
  let natureEnabled = true
  let sfxEnabled = true
  let bgmVol = 0.35
  let natureVol = 0.3
  let sfxVol = 0.45
  let bgmId: BgmId = 'dawn'
  let natureId: NatureId = 'none'

  let bgmNodes: AudioNode[] = []
  let bgmOsc: OscillatorNode[] = []
  let natureStops: Stoppable[] = []
  let natureTimers: number[] = []

  function ensure() {
    if (ctx) return
    ctx = new (getAC())()
    master = ctx.createGain()
    bgmBus = ctx.createGain()
    natureBus = ctx.createGain()
    sfxBus = ctx.createGain()
    master.gain.value = masterOn ? 1 : 0
    bgmBus.gain.value = 0
    natureBus.gain.value = 0
    sfxBus.gain.value = sfxEnabled ? sfxVol : 0
    bgmBus.connect(master)
    natureBus.connect(master)
    sfxBus.connect(master)
    master.connect(ctx.destination)
  }

  async function resume() {
    ensure()
    if (ctx?.state === 'suspended') await ctx.resume()
  }

  function clearBgm() {
    bgmOsc.forEach((o) => {
      try {
        o.stop()
      } catch {
        /* */
      }
    })
    bgmOsc = []
    bgmNodes = []
  }

  function clearNature() {
    natureTimers.forEach((t) => window.clearTimeout(t))
    natureTimers = []
    natureStops.forEach((s) => s.stop())
    natureStops = []
  }

  function applyBusGains() {
    if (!ctx || !bgmBus || !natureBus || !sfxBus || !master) return
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.linearRampToValueAtTime(masterOn ? 1 : 0, now + 0.2)

    const wantBgm = masterOn && bgmEnabled
    bgmBus.gain.cancelScheduledValues(now)
    bgmBus.gain.linearRampToValueAtTime(wantBgm ? bgmVol : 0, now + 0.35)

    const wantNature = masterOn && natureEnabled && natureId !== 'none'
    natureBus.gain.cancelScheduledValues(now)
    natureBus.gain.linearRampToValueAtTime(wantNature ? natureVol : 0, now + 0.35)

    sfxBus.gain.cancelScheduledValues(now)
    sfxBus.gain.linearRampToValueAtTime(masterOn && sfxEnabled ? sfxVol : 0, now + 0.15)
  }

  function startBgm(id: BgmId) {
    ensure()
    if (!ctx || !bgmBus) return
    clearBgm()
    const preset = bgmPresets.find((p) => p.id === id) ?? bgmPresets[0]
    preset.freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const lfo = ctx!.createOscillator()
      const lfoGain = ctx!.createGain()
      osc.type = preset.type
      osc.frequency.value = f
      gain.gain.value = (0.11 - i * 0.015) * (preset.freqs.length <= 2 ? 1.35 : 1)
      lfo.frequency.value = preset.lfo + i * 0.02
      lfoGain.gain.value = 3 + i * 0.8
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      osc.connect(gain)
      gain.connect(bgmBus!)
      osc.start()
      lfo.start()
      bgmOsc.push(osc, lfo)
      bgmNodes.push(gain)
    })
  }

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms)
    natureTimers.push(id)
    return id
  }

  function startNoisePad(filterFreq: number, q: number, gainVal: number, lfoRate: number) {
    if (!ctx || !natureBus) return
    const src = ctx.createBufferSource()
    src.buffer = makeNoiseBuffer(ctx, 3)
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = filterFreq
    filter.Q.value = q
    const gain = ctx.createGain()
    gain.gain.value = gainVal
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = lfoRate
    lfoGain.gain.value = filterFreq * 0.25
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(natureBus)
    src.start()
    lfo.start()
    natureStops.push({
      stop: () => {
        try {
          src.stop()
          lfo.stop()
        } catch {
          /* */
        }
      },
    })
  }

  function chirpBurst() {
    if (!ctx || !natureBus) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    const f0 = 1800 + Math.random() * 1400
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f0, now)
    osc.frequency.exponentialRampToValueAtTime(f0 * (0.6 + Math.random() * 0.5), now + 0.12)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
    osc.connect(gain)
    gain.connect(natureBus)
    osc.start(now)
    osc.stop(now + 0.16)
  }

  function drip() {
    if (!ctx || !natureBus) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    const now = ctx.currentTime
    osc.type = 'sine'
    osc.frequency.setValueAtTime(900 + Math.random() * 500, now)
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.25)
    filter.type = 'lowpass'
    filter.frequency.value = 1200
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(natureBus)
    osc.start(now)
    osc.stop(now + 0.32)
  }

  function cricket() {
    if (!ctx || !natureBus) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    osc.type = 'square'
    osc.frequency.value = 4200 + Math.random() * 800
    gain.gain.setValueAtTime(0.0001, now)
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.045
      gain.gain.exponentialRampToValueAtTime(0.03, t + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    }
    osc.connect(gain)
    gain.connect(natureBus)
    osc.start(now)
    osc.stop(now + 0.25)
  }

  function loopRandom(fn: () => void, minMs: number, maxMs: number) {
    const tick = () => {
      fn()
      schedule(tick, minMs + Math.random() * (maxMs - minMs))
    }
    schedule(tick, minMs * 0.4)
  }

  function startNature(id: NatureId) {
    ensure()
    clearNature()
    if (!ctx || !natureBus || id === 'none') return

    switch (id) {
      case 'wind':
        startNoisePad(420, 0.7, 0.055, 0.07)
        break
      case 'birds':
        startNoisePad(280, 0.5, 0.012, 0.04)
        loopRandom(chirpBurst, 1800, 5200)
        break
      case 'drops':
        loopRandom(drip, 900, 2800)
        break
      case 'forest':
        startNoisePad(380, 0.8, 0.04, 0.05)
        loopRandom(chirpBurst, 2200, 6000)
        break
      case 'sea':
        startNoisePad(180, 0.55, 0.07, 0.08)
        startNoisePad(90, 0.4, 0.04, 0.03)
        break
      case 'rain':
        startNoisePad(2200, 0.35, 0.045, 0.2)
        startNoisePad(900, 0.5, 0.03, 0.12)
        break
      case 'stream':
        startNoisePad(1100, 0.6, 0.04, 0.25)
        startNoisePad(500, 0.7, 0.03, 0.1)
        loopRandom(drip, 1400, 3600)
        break
      case 'night':
        startNoisePad(200, 0.5, 0.015, 0.03)
        loopRandom(cricket, 700, 2200)
        break
      case 'meadow':
        startNoisePad(500, 0.65, 0.035, 0.06)
        loopRandom(chirpBurst, 2500, 7000)
        break
    }
  }

  function playSfx(kind: 'scene' | 'tap' | 'devotion') {
    ensure()
    if (!ctx || !sfxBus || !masterOn || !sfxEnabled) return
    void ctx.resume()
    const now = ctx.currentTime

    if (kind === 'tap') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 680
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
      osc.connect(gain)
      gain.connect(sfxBus)
      osc.start(now)
      osc.stop(now + 0.1)
      return
    }

    if (kind === 'scene') {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc2.type = 'triangle'
      osc.frequency.setValueAtTime(392, now)
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.35)
      osc2.frequency.setValueAtTime(784, now)
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(sfxBus)
      osc.start(now)
      osc2.start(now)
      osc.stop(now + 0.6)
      osc2.stop(now + 0.6)
      return
    }

    // devotion soft bell
    ;[523.25, 659.25, 783.99].forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const t = now + i * 0.12
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      osc.connect(gain)
      gain.connect(sfxBus!)
      osc.start(t)
      osc.stop(t + 1.25)
    })
  }

  function syncPlayback() {
    ensure()
    void resume()
    if (bgmEnabled && masterOn) startBgm(bgmId)
    else clearBgm()
    if (natureEnabled && masterOn && natureId !== 'none') startNature(natureId)
    else clearNature()
    applyBusGains()
  }

  return {
    resume,
    setMasterOn(on) {
      masterOn = on
      syncPlayback()
    },
    setBgm(id, enabled, volume) {
      const changed = id !== bgmId || enabled !== bgmEnabled
      bgmId = id
      bgmEnabled = enabled
      bgmVol = Math.max(0, Math.min(1, volume))
      if (changed && enabled && masterOn) startBgm(id)
      if (!enabled) clearBgm()
      applyBusGains()
      if (enabled && masterOn && bgmOsc.length === 0) startBgm(id)
    },
    setNature(id, enabled, volume) {
      const changed = id !== natureId || enabled !== natureEnabled
      natureId = id
      natureEnabled = enabled
      natureVol = Math.max(0, Math.min(1, volume))
      if (changed) {
        if (enabled && masterOn && id !== 'none') startNature(id)
        else clearNature()
      }
      applyBusGains()
    },
    setSfx(enabled, volume) {
      sfxEnabled = enabled
      sfxVol = Math.max(0, Math.min(1, volume))
      applyBusGains()
    },
    playSfx,
    dispose() {
      clearBgm()
      clearNature()
      void ctx?.close()
      ctx = null
    },
  }
}
