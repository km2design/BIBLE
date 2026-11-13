import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_BGM,
  DEFAULT_NATURE,
  type BgmId,
  type NatureId,
} from '../data/audioPresets'
import { createAudioEngine, type AudioEngine } from '../lib/audioEngine'

const STORAGE_KEY = 'guangdao-audio-v1'

export type AudioSettingsState = {
  masterOn: boolean
  bgmId: BgmId
  bgmOn: boolean
  bgmVolume: number
  sfxOn: boolean
  sfxVolume: number
  natureId: NatureId
  natureOn: boolean
  natureVolume: number
}

type AudioSettingsApi = AudioSettingsState & {
  setMasterOn: (on: boolean) => void
  toggleMaster: () => void
  setBgmId: (id: BgmId) => void
  setBgmOn: (on: boolean) => void
  setBgmVolume: (v: number) => void
  setSfxOn: (on: boolean) => void
  setSfxVolume: (v: number) => void
  setNatureId: (id: NatureId) => void
  setNatureOn: (on: boolean) => void
  setNatureVolume: (v: number) => void
  playSfx: (kind: 'scene' | 'tap' | 'devotion') => void
  unlock: () => void
}

const defaults: AudioSettingsState = {
  masterOn: true,
  bgmId: DEFAULT_BGM,
  bgmOn: true,
  bgmVolume: 0.35,
  sfxOn: true,
  sfxVolume: 0.45,
  natureId: DEFAULT_NATURE,
  natureOn: true,
  natureVolume: 0.3,
}

function load(): AudioSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return defaults
  }
}

const AudioSettingsContext = createContext<AudioSettingsApi | null>(null)

export function AudioSettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioSettingsState>(() =>
    typeof window === 'undefined' ? defaults : load(),
  )
  const engineRef = useRef<AudioEngine | null>(null)

  useEffect(() => {
    engineRef.current = createAudioEngine()
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const e = engineRef.current
    if (!e) return
    e.setMasterOn(state.masterOn)
    e.setBgm(state.bgmId, state.bgmOn, state.bgmVolume)
    e.setNature(state.natureId, state.natureOn, state.natureVolume)
    e.setSfx(state.sfxOn, state.sfxVolume)
  }, [state])

  const unlock = useCallback(() => {
    void engineRef.current?.resume()
  }, [])

  const playSfx = useCallback((kind: 'scene' | 'tap' | 'devotion') => {
    engineRef.current?.playSfx(kind)
  }, [])

  const api = useMemo<AudioSettingsApi>(
    () => ({
      ...state,
      setMasterOn: (on) => {
        unlock()
        setState((s) => ({ ...s, masterOn: on }))
      },
      toggleMaster: () => {
        unlock()
        setState((s) => ({ ...s, masterOn: !s.masterOn }))
      },
      setBgmId: (id) => {
        unlock()
        setState((s) => ({ ...s, bgmId: id, bgmOn: true }))
      },
      setBgmOn: (on) => {
        unlock()
        setState((s) => ({ ...s, bgmOn: on }))
      },
      setBgmVolume: (v) => setState((s) => ({ ...s, bgmVolume: v })),
      setSfxOn: (on) => {
        unlock()
        setState((s) => ({ ...s, sfxOn: on }))
      },
      setSfxVolume: (v) => setState((s) => ({ ...s, sfxVolume: v })),
      setNatureId: (id) => {
        unlock()
        setState((s) => ({ ...s, natureId: id, natureOn: id !== 'none' }))
      },
      setNatureOn: (on) => {
        unlock()
        setState((s) => ({ ...s, natureOn: on }))
      },
      setNatureVolume: (v) => setState((s) => ({ ...s, natureVolume: v })),
      playSfx,
      unlock,
    }),
    [state, playSfx, unlock],
  )

  return <AudioSettingsContext.Provider value={api}>{children}</AudioSettingsContext.Provider>
}

export function useAudioSettings() {
  const ctx = useContext(AudioSettingsContext)
  if (!ctx) throw new Error('useAudioSettings must be used within AudioSettingsProvider')
  return ctx
}
