/** Soft ambient pad via Web Audio — no external audio files needed. */

type AmbientHandle = {
  start: () => void
  stop: () => void
  setVolume: (v: number) => void
  isPlaying: () => boolean
}

export function createAmbientMusic(): AmbientHandle {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let nodes: OscillatorNode[] = []
  let playing = false
  let volume = 0.28

  const freqs = [110, 164.81, 196, 246.94] // warm A minor-ish pad

  function ensure() {
    if (ctx) return
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
  }

  function start() {
    ensure()
    if (!ctx || !master || playing) return
    void ctx.resume()
    playing = true
    nodes = []

    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(volume, now + 1.8)

    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      const lfo = ctx!.createOscillator()
      const lfoGain = ctx!.createGain()

      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = f
      gain.gain.value = 0.12 - i * 0.02

      lfo.frequency.value = 0.08 + i * 0.03
      lfoGain.gain.value = 4 + i
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)

      osc.connect(gain)
      gain.connect(master!)
      osc.start()
      lfo.start()
      nodes.push(osc, lfo)
    })
  }

  function stop() {
    if (!ctx || !master || !playing) return
    const now = ctx.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + 0.8)
    playing = false
    const toStop = [...nodes]
    nodes = []
    window.setTimeout(() => {
      toStop.forEach((n) => {
        try {
          n.stop()
        } catch {
          /* already stopped */
        }
      })
    }, 900)
  }

  function setVolume(v: number) {
    volume = Math.max(0, Math.min(1, v))
    if (master && playing) {
      master.gain.linearRampToValueAtTime(volume, ctx!.currentTime + 0.2)
    }
  }

  return {
    start,
    stop,
    setVolume,
    isPlaying: () => playing,
  }
}
