'use client'

import { useRouter } from 'next/navigation'
import { bgmPresets, naturePresets } from '../../data/audioPresets'
import { useAudioSettings } from '../../context/AudioSettings'

function VolumeRow({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <label className={`volume-row ${disabled ? 'disabled' : ''}`}>
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <em>{Math.round(value * 100)}</em>
    </label>
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      className={`toggle-pill ${checked ? 'on' : ''}`}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      {label} · {checked ? '開' : '關'}
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const audio = useAudioSettings()

  return (
    <main className="page settings-page">
      <header className="page-header">
        <button type="button" className="back-link" onClick={() => router.back()}>
          ← 返回
        </button>
        <h1>音效設定</h1>
        <p>選擇柔和背景音樂、動畫音效與大自然環境聲，並分別調整音量。</p>
      </header>

      <section className="settings-block">
        <div className="settings-block-head">
          <h2>總開關</h2>
          <Toggle checked={audio.masterOn} onChange={audio.setMasterOn} label="全部音效" />
        </div>
        <p className="settings-hint">右上角也可快速開關。關閉後背景樂、環境聲與動畫音效都會靜音。</p>
      </section>

      <section className="settings-block">
        <div className="settings-block-head">
          <h2>背景純音樂</h2>
          <Toggle checked={audio.bgmOn} onChange={audio.setBgmOn} label="音樂" />
        </div>
        <VolumeRow label="音量" value={audio.bgmVolume} onChange={audio.setBgmVolume} disabled={!audio.bgmOn || !audio.masterOn} />
        <ul className="choice-grid">
          {bgmPresets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`choice-chip ${audio.bgmId === p.id ? 'active' : ''}`}
                onClick={() => {
                  audio.unlock()
                  audio.setBgmId(p.id)
                  audio.playSfx('tap')
                }}
              >
                <strong>{p.label}</strong>
                <span>{p.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-block">
        <div className="settings-block-head">
          <h2>動畫音效</h2>
          <Toggle checked={audio.sfxOn} onChange={audio.setSfxOn} label="音效" />
        </div>
        <p className="settings-hint">換幕、進入靈修等動畫節奏聲。可開關並調音量。</p>
        <VolumeRow label="音量" value={audio.sfxVolume} onChange={audio.setSfxVolume} disabled={!audio.sfxOn || !audio.masterOn} />
        <button
          type="button"
          className="btn soft"
          onClick={() => {
            audio.unlock()
            audio.playSfx('scene')
          }}
        >
          試聽換幕音效
        </button>
      </section>

      <section className="settings-block">
        <div className="settings-block-head">
          <h2>環境聲 · 大自然</h2>
          <Toggle checked={audio.natureOn} onChange={audio.setNatureOn} label="環境" />
        </div>
        <VolumeRow
          label="音量"
          value={audio.natureVolume}
          onChange={audio.setNatureVolume}
          disabled={!audio.natureOn || !audio.masterOn}
        />
        <ul className="choice-grid">
          {naturePresets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={`choice-chip ${audio.natureId === p.id ? 'active' : ''}`}
                onClick={() => {
                  audio.unlock()
                  audio.setNatureId(p.id)
                  audio.playSfx('tap')
                }}
              >
                <strong>{p.label}</strong>
                <span>{p.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
