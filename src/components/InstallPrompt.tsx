'use client'

import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const media = window.matchMedia('(display-mode: standalone)').matches
  const ios = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return media || ios
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const notOther = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return iOS && webkit && notOther
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosTip, setShowIosTip] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    if (isStandaloneDisplay()) return
    if (sessionStorage.getItem('guangdao-install-dismissed') === '1') return

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setHidden(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    if (isIosSafari()) {
      setShowIosTip(true)
      setHidden(false)
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (hidden || (!deferred && !showIosTip)) return null

  const dismiss = () => {
    sessionStorage.setItem('guangdao-install-dismissed', '1')
    setHidden(true)
    setDeferred(null)
    setShowIosTip(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setHidden(true)
  }

  return (
    <div className="install-prompt" role="region" aria-label="安裝應用程式">
      <div className="install-prompt-copy">
        <strong>光道</strong>
        {deferred ? (
          <span>加到主畫面，像 App 一樣打開</span>
        ) : (
          <span>
            用 Safari「分享」→「加入主畫面」安裝
          </span>
        )}
      </div>
      <div className="install-prompt-actions">
        {deferred ? (
          <button type="button" className="btn soft install-btn" onClick={install}>
            安裝 App
          </button>
        ) : null}
        <button type="button" className="install-dismiss" onClick={dismiss} aria-label="關閉">
          稍後
        </button>
      </div>
    </div>
  )
}
