'use client'

import Link from 'next/link'
import { useAudioSettings } from '../context/AudioSettings'

export function AudioControls({ className = '' }: { className?: string }) {
  const audio = useAudioSettings()

  return (
    <div className={`audio-controls ${className}`}>
      <button
        type="button"
        className={`icon-btn music ${audio.masterOn ? 'on' : ''}`}
        onClick={() => audio.toggleMaster()}
        aria-label={audio.masterOn ? '關閉音效' : '開啟音效'}
        aria-pressed={audio.masterOn}
        title={audio.masterOn ? '音效開啟' : '音效關閉'}
      >
        <span aria-hidden>{audio.masterOn ? '♪' : '✕'}</span>
        <small>{audio.masterOn ? '開' : '關'}</small>
      </button>
      <Link href="/settings" className="icon-btn settings-btn" aria-label="音效設定" title="設定">
        <span aria-hidden>⚙</span>
      </Link>
    </div>
  )
}
