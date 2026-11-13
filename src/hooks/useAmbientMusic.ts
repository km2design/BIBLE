import { useEffect, useRef, useState } from 'react'
import { createAmbientMusic } from '../lib/ambientMusic'

export function useAmbientMusic(enabled: boolean) {
  const musicRef = useRef<ReturnType<typeof createAmbientMusic> | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    musicRef.current = createAmbientMusic()
    return () => {
      musicRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    const music = musicRef.current
    if (!music) return
    if (enabled) {
      music.start()
      setPlaying(true)
    } else {
      music.stop()
      setPlaying(false)
    }
  }, [enabled])

  return { playing }
}
