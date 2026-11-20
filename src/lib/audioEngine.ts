import { bgmPresets, naturePresets, type BgmId, type NatureId } from '../data/audioPresets'

function getAC(): typeof AudioContext {
  return window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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
  let activeBgmId: BgmId | null = null
  let activeNatureId: NatureId | null = null

  const bgmElements = new Map<BgmId, HTMLAudioElement>()
  const bgmConnected = new Set<BgmId>()
  const natureElements = new Map<NatureId, HTMLAudioElement>()
  const natureConnected = new Set<NatureId>()

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

  function getBgmElement(id: BgmId) {
    ensure()
    let el = bgmElements.get(id)
    if (!el) {
      const preset = bgmPresets.find((p) => p.id === id) ?? bgmPresets[0]
      el = new Audio(preset.src)
      el.loop = true
      el.preload = 'metadata'
      bgmElements.set(id, el)
    }
    if (ctx && bgmBus && !bgmConnected.has(id)) {
      const src = ctx.createMediaElementSource(el)
      src.connect(bgmBus)
      bgmConnected.add(id)
    }
    return el
  }

  function getNatureElement(id: NatureId) {
    ensure()
    if (id === 'none') return null
    let el = natureElements.get(id)
    if (!el) {
      const preset = naturePresets.find((p) => p.id === id)
      if (!preset?.src) return null
      el = new Audio(preset.src)
      el.loop = true
      el.preload = 'metadata'
      natureElements.set(id, el)
    }
    if (ctx && natureBus && !natureConnected.has(id)) {
      const src = ctx.createMediaElementSource(el)
      src.connect(natureBus)
      natureConnected.add(id)
    }
    return el
  }

  function clearBgm() {
    bgmElements.forEach((el) => {
      el.pause()
    })
    activeBgmId = null
  }

  function clearNature() {
    natureElements.forEach((el) => {
      el.pause()
    })
    activeNatureId = null
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
    void ctx.resume()

    if (activeBgmId && activeBgmId !== id) {
      bgmElements.get(activeBgmId)?.pause()
    }

    const el = getBgmElement(id)
    if (activeBgmId !== id) {
      try {
        el.currentTime = 0
      } catch {
        /* ignore seek errors while loading */
      }
    }
    activeBgmId = id
    void el.play().catch(() => {
      /* autoplay may fail until user gesture */
    })
  }

  function startNature(id: NatureId) {
    ensure()
    if (!ctx || !natureBus || id === 'none') {
      clearNature()
      return
    }
    void ctx.resume()

    if (activeNatureId && activeNatureId !== id) {
      natureElements.get(activeNatureId)?.pause()
    }

    const el = getNatureElement(id)
    if (!el) {
      clearNature()
      return
    }
    if (activeNatureId !== id) {
      try {
        el.currentTime = 0
      } catch {
        /* ignore */
      }
    }
    activeNatureId = id
    void el.play().catch(() => {
      /* autoplay may fail until user gesture */
    })
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
      if (!enabled || !masterOn) {
        clearBgm()
      } else if (changed || activeBgmId !== id) {
        startBgm(id)
      }
      applyBusGains()
    },
    setNature(id, enabled, volume) {
      const changed = id !== natureId || enabled !== natureEnabled
      natureId = id
      natureEnabled = enabled
      natureVol = Math.max(0, Math.min(1, volume))
      if (!enabled || !masterOn || id === 'none') {
        clearNature()
      } else if (changed || activeNatureId !== id) {
        startNature(id)
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
      bgmElements.forEach((el) => {
        el.src = ''
      })
      natureElements.forEach((el) => {
        el.src = ''
      })
      bgmElements.clear()
      natureElements.clear()
      bgmConnected.clear()
      natureConnected.clear()
      void ctx?.close()
      ctx = null
    },
  }
}
