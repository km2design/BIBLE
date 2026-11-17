'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { DailyStory, WisdomKind } from '../../data/dailyStories'
import type { AdminAppSettings, PublishMode, WeekStoryItem } from '../../lib/adminTypes'

type Tab = 'settings' | 'day' | 'week' | 'comments'

type AdminComment = {
  id: string
  nickname: string
  body: string
  hidden: boolean
  is_admin: boolean
  parent_id: string | null
  created_at: string
}

const KINDS: WisdomKind[] = ['反思', '名言', '提醒', '警告', '勸戒', '鼓勵', '安慰', '同理']

const EMPTY: DailyStory = {
  date: '',
  characterId: 'story',
  title: '',
  story: '',
  verseRef: '',
  verse: '',
  wisdomKind: '反思',
  wisdom: '',
  devotionTitle: '',
  devotion: '',
  prayer: '',
}

export function AdminClient() {
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [today, setToday] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [tab, setTab] = useState<Tab>('day')
  const [editDate, setEditDate] = useState('')
  const [story, setStory] = useState<DailyStory>(EMPTY)
  const [source, setSource] = useState('')
  const [hasImage, setHasImage] = useState(false)
  const [imageUrl, setImageUrl] = useState('/daily/default-hero.jpg')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [comments, setComments] = useState<AdminComment[]>([])
  const [commentDate, setCommentDate] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyParent, setReplyParent] = useState<string | null>(null)
  const [settings, setSettings] = useState<AdminAppSettings>({
    publishMode: 'open',
    autoGenImage: false,
  })
  const [weekItems, setWeekItems] = useState<WeekStoryItem[]>([])

  const refreshMe = useCallback(async () => {
    const res = await fetch('/api/admin/me')
    if (res.status === 503) {
      setEnabled(false)
      setAuthed(false)
      return
    }
    setEnabled(true)
    if (!res.ok) {
      setAuthed(false)
      return
    }
    const data = (await res.json()) as {
      authenticated?: boolean
      today?: string
      tomorrow?: string
    }
    setAuthed(Boolean(data.authenticated))
    if (data.today) {
      setToday(data.today)
      setCommentDate(data.today)
      setEditDate((prev) => prev || data.today || '')
    }
    if (data.tomorrow) setTomorrow(data.tomorrow)
  }, [])

  const loadSettings = useCallback(async () => {
    const res = await fetch('/api/admin/settings')
    if (!res.ok) return
    const data = (await res.json()) as { settings?: AdminAppSettings }
    if (data.settings) setSettings(data.settings)
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const loadStory = useCallback(async (date: string) => {
    setBusy(true)
    setStatus('')
    try {
      const res = await fetch(`/api/admin/story?date=${encodeURIComponent(date)}`)
      const data = (await res.json()) as {
        story?: DailyStory
        source?: string
        hasImage?: boolean
        imageUrl?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '載入失敗')
        return
      }
      setStory(data.story ? { ...data.story, date } : { ...EMPTY, date })
      setSource(data.source || '')
      setHasImage(Boolean(data.hasImage))
      setImageUrl(data.imageUrl || '/daily/default-hero.jpg')
    } finally {
      setBusy(false)
    }
  }, [])

  const loadWeek = useCallback(async () => {
    const res = await fetch(`/api/admin/story/week?start=${encodeURIComponent(today || '')}`)
    const data = (await res.json()) as { items?: WeekStoryItem[]; error?: string }
    if (!res.ok) {
      setStatus(data.error || '載入週覽失敗')
      return
    }
    setWeekItems(data.items || [])
  }, [today])

  const loadComments = useCallback(async (date: string) => {
    const res = await fetch(`/api/admin/comments?date=${encodeURIComponent(date)}&all=1`)
    const data = (await res.json()) as { comments?: AdminComment[] }
    if (res.ok) setComments(data.comments || [])
  }, [])

  useEffect(() => {
    if (!authed) return
    void loadSettings()
  }, [authed, loadSettings])

  useEffect(() => {
    if (!authed) return
    if (tab === 'comments') {
      void loadComments(commentDate || today)
    } else if (tab === 'week') {
      if (today) void loadWeek()
    } else if (tab === 'day') {
      const date = editDate || tomorrow || today
      if (date) void loadStory(date)
    }
  }, [authed, tab, today, tomorrow, editDate, commentDate, loadStory, loadComments, loadWeek])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      setLoginError(data.error || '登入失敗')
      return
    }
    setPassword('')
    await refreshMe()
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
  }

  async function saveSettings(patch: Partial<AdminAppSettings>) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as {
        settings?: AdminAppSettings
        message?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '設定儲存失敗')
        return
      }
      if (data.settings) setSettings(data.settings)
      setStatus(data.message || '設定已更新')
    } finally {
      setBusy(false)
    }
  }

  async function syncPublic(promoteDrafts: boolean) {
    setBusy(true)
    setStatus(promoteDrafts ? '核准草稿並同步公開…' : '同步公開（模式 B · 清未核准）…')
    try {
      const res = await fetch('/api/admin/story/sync-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromDate: '2026-11-18', promoteDrafts }),
      })
      const data = (await res.json()) as {
        message?: string
        error?: string
        report?: {
          cleared?: { date: string }[]
          refreshed?: { date: string; title: string }[]
          approvedPublic?: { date: string; title: string }[]
        }
      }
      if (!res.ok) {
        setStatus(data.error || '同步失敗')
        return
      }
      await loadSettings()
      await loadWeek()
      if (editDate) await loadStory(editDate)
      const cleared = data.report?.cleared?.map((c) => c.date).join(', ') || '無'
      const refreshed = data.report?.refreshed?.map((r) => `${r.date}「${r.title}」`).join(', ') || '無'
      const approved =
        data.report?.approvedPublic?.map((a) => `${a.date}「${a.title}」`).join(', ') || '無'
      setStatus(
        `${data.message || '已同步'}｜清除：${cleared}｜刷新：${refreshed}｜公開核准：${approved}`,
      )
    } finally {
      setBusy(false)
    }
  }

  async function generate() {
    const date = editDate || tomorrow || today
    setBusy(true)
    setStatus('正在生成文字…')
    try {
      const res = await fetch('/api/admin/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const data = (await res.json()) as {
        story?: DailyStory
        source?: string
        hasImage?: boolean
        imageUrl?: string
        message?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '生成失敗')
        return
      }
      if (data.story) setStory({ ...data.story, date })
      if (data.source) setSource(data.source)
      setHasImage(Boolean(data.hasImage))
      setImageUrl(data.imageUrl || `/api/admin/story/image?date=${encodeURIComponent(date)}&t=${Date.now()}`)
      setStatus(data.message || '已生成')
      if (tab === 'week') await loadWeek()
    } finally {
      setBusy(false)
    }
  }

  async function genImage(force: boolean) {
    const date = editDate || tomorrow || today
    setBusy(true)
    setStatus(force ? '正在再 GEN 圖…' : '正在 GEN 圖…')
    try {
      const res = await fetch('/api/admin/story/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...story, date, force }),
      })
      const data = (await res.json()) as {
        story?: DailyStory
        source?: string
        hasImage?: boolean
        imageUrl?: string
        message?: string
        error?: string
        generated?: boolean
      }
      if (!res.ok && !data.hasImage) {
        setStatus(data.error || data.message || 'GEN 圖失敗')
        return
      }
      if (data.story) setStory({ ...data.story, date })
      if (data.source) setSource(data.source)
      setHasImage(Boolean(data.hasImage))
      setImageUrl(
        data.imageUrl ||
          `/api/admin/story/image?date=${encodeURIComponent(date)}&t=${Date.now()}`,
      )
      setStatus(data.message || (data.generated ? '已 GEN 圖' : '插畫狀態已更新'))
      if (tab === 'week') await loadWeek()
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    const date = editDate || tomorrow || today
    setBusy(true)
    setStatus('')
    try {
      const res = await fetch('/api/admin/story', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...story, date }),
      })
      const data = (await res.json()) as {
        story?: DailyStory
        source?: string
        hasImage?: boolean
        imageUrl?: string
        message?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '儲存失敗')
        return
      }
      if (data.story) setStory(data.story)
      if (data.source) setSource(data.source)
      if (typeof data.hasImage === 'boolean') setHasImage(data.hasImage)
      if (data.imageUrl) setImageUrl(data.imageUrl)
      setStatus(data.message || '已核准')
      if (tab === 'week') await loadWeek()
    } finally {
      setBusy(false)
    }
  }

  async function generateWeek() {
    setBusy(true)
    setStatus('正在預產一週文字…')
    try {
      const res = await fetch('/api/admin/story/week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: today }),
      })
      const data = (await res.json()) as {
        items?: WeekStoryItem[]
        message?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '週預產失敗')
        return
      }
      setWeekItems(data.items || [])
      setStatus(data.message || '一週文字已預產')
    } finally {
      setBusy(false)
    }
  }

  async function openWeekDay(date: string) {
    setEditDate(date)
    setTab('day')
  }

  async function deleteComment(id: string) {
    if (!confirm('確定刪除此留言？')) return
    const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
    if (res.ok) await loadComments(commentDate || today)
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: commentDate || today,
        body: replyBody,
        parentId: replyParent,
      }),
    })
    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setStatus(data.error || '回覆失敗')
      return
    }
    setReplyBody('')
    setReplyParent(null)
    await loadComments(commentDate || today)
  }

  if (enabled === null) {
    return (
      <main className="page admin-page">
        <p className="daily-block">載入中…</p>
      </main>
    )
  }

  if (!enabled) {
    return (
      <main className="page admin-page">
        <header className="page-header">
          <Link href="/" className="back-link">
            ← 光道
          </Link>
          <h1>管理後台</h1>
          <p>後台未啟用：請在 Cursor App Secrets 設定 `ADMIN_USERNAME` 與 `ADMIN_PASSWORD` 後重新發布。</p>
        </header>
      </main>
    )
  }

  if (!authed) {
    return (
      <main className="page admin-page">
        <header className="page-header">
          <Link href="/" className="back-link">
            ← 光道
          </Link>
          <h1>管理登入</h1>
        </header>
        <form className="admin-login" onSubmit={login}>
          <label>
            帳號
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            密碼
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {loginError ? <p className="comment-error">{loginError}</p> : null}
          <button type="submit" className="btn primary">
            登入
          </button>
        </form>
      </main>
    )
  }

  const modeLabel =
    settings.publishMode === 'approve_required' ? '模式 B · 必須核准' : '模式 A · 預產可公開'
  const imageModeLabel = settings.autoGenImage ? '自動 GEN 圖' : '人手 GEN 圖'

  return (
    <main className="page admin-page">
      <header className="page-header admin-header">
        <Link href="/" className="back-link">
          ← 光道
        </Link>
        <h1>管理後台</h1>
        <button type="button" className="btn soft" onClick={logout}>
          登出
        </button>
      </header>

      <p className="admin-meta">
        {modeLabel} · {imageModeLabel}
      </p>

      <nav className="admin-tabs" aria-label="管理分頁">
        <button
          type="button"
          className={tab === 'settings' ? 'active' : undefined}
          onClick={() => setTab('settings')}
        >
          設定
        </button>
        <button
          type="button"
          className={tab === 'day' ? 'active' : undefined}
          onClick={() => {
            setTab('day')
            if (!editDate) setEditDate(tomorrow || today)
          }}
        >
          單日 · {editDate || tomorrow}
        </button>
        <button
          type="button"
          className={tab === 'week' ? 'active' : undefined}
          onClick={() => setTab('week')}
        >
          一週預覽
        </button>
        <button
          type="button"
          className={tab === 'comments' ? 'active' : undefined}
          onClick={() => setTab('comments')}
        >
          留言
        </button>
      </nav>

      {status ? <p className="admin-status">{status}</p> : null}

      {tab === 'settings' ? (
        <section className="admin-story admin-settings">
          <h2 className="admin-section-title">發布模式</h2>
          <p className="admin-lead">
            模式 A：預產／cron 生成後，到了該日即可公開（可不按核准）。模式 B：未核准絕不公開（不含 sample／grok
            自動上街）。
          </p>
          <div className="admin-choice-row" role="radiogroup" aria-label="發布模式">
            <button
              type="button"
              className={settings.publishMode === 'open' ? 'choice-chip active' : 'choice-chip'}
              onClick={() => void saveSettings({ publishMode: 'open' as PublishMode })}
              disabled={busy}
            >
              模式 A · 預產可公開
            </button>
            <button
              type="button"
              className={
                settings.publishMode === 'approve_required' ? 'choice-chip active' : 'choice-chip'
              }
              onClick={() => void saveSettings({ publishMode: 'approve_required' as PublishMode })}
              disabled={busy}
            >
              模式 B · 必須核准
            </button>
          </div>

          <h2 className="admin-section-title">插畫 GEN</h2>
          <p className="admin-lead">
            預設人手：建立文字時不自動畫圖，由你按「GEN 圖」。若開啟自動，仍可隨時「再 GEN 圖」。
          </p>
          <div className="admin-choice-row" role="radiogroup" aria-label="插畫模式">
            <button
              type="button"
              className={!settings.autoGenImage ? 'choice-chip active' : 'choice-chip'}
              onClick={() => void saveSettings({ autoGenImage: false })}
              disabled={busy}
            >
              人手 GEN 圖
            </button>
            <button
              type="button"
              className={settings.autoGenImage ? 'choice-chip active' : 'choice-chip'}
              onClick={() => void saveSettings({ autoGenImage: true })}
              disabled={busy}
            >
              自動 GEN 圖
            </button>
          </div>

          <h2 className="admin-section-title">同步公開</h2>
          <p className="admin-lead">
            自 2026-11-18 起：鎖定模式 B、刪除 sample／grok 未核准公開列、把舊公仔樣本核准稿刷新為茶記文稿。可重複執行。若草稿已審好，用「核准草稿並同步」一次上街。
          </p>
          <div className="admin-actions">
            <button
              type="button"
              className="btn primary"
              onClick={() => void syncPublic(false)}
              disabled={busy}
            >
              同步公開（清未核准）
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void syncPublic(true)}
              disabled={busy}
            >
              核准草稿並同步
            </button>
          </div>
        </section>
      ) : null}

      {tab === 'week' ? (
        <section className="admin-story">
          <p className="admin-lead">
            一次預產今起 7 日文字（已核准日略過）。公開仍跟目前發布模式；每集可進單日批改、GEN 圖、核准。
          </p>
          <div className="admin-actions">
            <button type="button" className="btn primary" onClick={generateWeek} disabled={busy}>
              預產一週文字
            </button>
            <button type="button" className="btn soft" onClick={() => void loadWeek()} disabled={busy}>
              重新整理
            </button>
          </div>
          <ul className="admin-week-list">
            {weekItems.map((item) => (
              <li key={item.date}>
                <button type="button" className="admin-week-row" onClick={() => void openWeekDay(item.date)}>
                  <span className="admin-week-date">{item.date}</span>
                  <strong>{item.title}</strong>
                  <span className="admin-week-meta">
                    {item.approved ? '已核准' : item.source === 'empty' ? '空白' : item.source}
                    {' · '}
                    {item.hasImage ? '有圖' : '無圖'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === 'day' ? (
        <section className="admin-story">
          <label className="admin-date-field">
            編輯日期
            <input
              type="date"
              value={editDate || tomorrow || today}
              min={today}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </label>
          <p className="admin-lead">
            ① 預產文字 → ② 批改 → ③ GEN／再 GEN 圖 → ④ 儲存核准。
            {settings.publishMode === 'approve_required'
              ? '（模式 B：未核准不會公開。）'
              : '（模式 A：已生成內容到日可公開。）'}
          </p>
          <p className="admin-meta">
            來源：{source || '—'} · 插畫：{hasImage ? '已 GEN' : '預設圖'} ·{' '}
            {busy ? '處理中…' : '可編輯'}
          </p>

          <figure className="admin-image-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="當日插畫預覽" width={392} height={584} />
            <figcaption>{hasImage ? '故事插畫預覽（僅後台可見）' : '尚無生成圖，顯示預設英雄圖'}</figcaption>
          </figure>

          <div className="admin-actions">
            <button type="button" className="btn soft" onClick={generate} disabled={busy}>
              ① 預產文字
            </button>
            <button type="button" className="btn soft" onClick={() => void genImage(false)} disabled={busy}>
              GEN 圖
            </button>
            <button type="button" className="btn soft" onClick={() => void genImage(true)} disabled={busy}>
              再 GEN 圖
            </button>
            <button type="button" className="btn primary" onClick={save} disabled={busy}>
              ④ 儲存核准
            </button>
          </div>

          <h2 className="admin-section-title">② 批改文稿</h2>
          <label>
            標題
            <input
              value={story.title}
              onChange={(e) => setStory({ ...story, title: e.target.value })}
            />
          </label>
          <label>
            故事正文
            <textarea
              rows={6}
              value={story.story}
              onChange={(e) => setStory({ ...story, story: e.target.value })}
            />
          </label>
          <label>
            經文出處
            <input
              value={story.verseRef}
              onChange={(e) => setStory({ ...story, verseRef: e.target.value })}
            />
          </label>
          <label>
            經文內容
            <textarea
              rows={3}
              value={story.verse}
              onChange={(e) => setStory({ ...story, verse: e.target.value })}
            />
          </label>
          <label>
            智慧類型
            <select
              value={story.wisdomKind}
              onChange={(e) =>
                setStory({ ...story, wisdomKind: e.target.value as WisdomKind })
              }
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label>
            人生智慧
            <textarea
              rows={2}
              value={story.wisdom}
              onChange={(e) => setStory({ ...story, wisdom: e.target.value })}
            />
          </label>
          <label>
            靈修標題
            <input
              value={story.devotionTitle}
              onChange={(e) => setStory({ ...story, devotionTitle: e.target.value })}
            />
          </label>
          <label>
            靈修反思
            <textarea
              rows={3}
              value={story.devotion}
              onChange={(e) => setStory({ ...story, devotion: e.target.value })}
            />
          </label>
          <label>
            簡短禱告
            <textarea
              rows={2}
              value={story.prayer}
              onChange={(e) => setStory({ ...story, prayer: e.target.value })}
            />
          </label>
        </section>
      ) : null}

      {tab === 'comments' ? (
        <section className="admin-comments">
          <label className="admin-date-field">
            日期
            <input
              type="date"
              value={commentDate || today}
              max={today}
              onChange={(e) => setCommentDate(e.target.value)}
            />
          </label>
          <form className="admin-reply" onSubmit={sendReply}>
            <label>
              {replyParent ? `回覆 #${replyParent}` : '版主留言／回覆'}
              <textarea
                rows={3}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                required
              />
            </label>
            <div className="admin-actions">
              {replyParent ? (
                <button type="button" className="install-dismiss" onClick={() => setReplyParent(null)}>
                  取消回覆對象
                </button>
              ) : null}
              <button type="submit" className="btn soft">
                送出回覆
              </button>
            </div>
          </form>
          <ul className="admin-comment-list">
            {comments.map((c) => (
              <li key={c.id} className={c.hidden ? 'is-hidden' : undefined}>
                <div className="admin-comment-head">
                  <strong>
                    #{c.id} {c.nickname}
                    {c.is_admin ? ' · 版主' : ''}
                    {c.hidden ? ' · 已刪' : ''}
                  </strong>
                  <time>{c.created_at}</time>
                </div>
                <p>{c.body}</p>
                <div className="admin-actions">
                  {!c.hidden ? (
                    <>
                      <button type="button" className="btn soft" onClick={() => setReplyParent(c.id)}>
                        回覆
                      </button>
                      <button type="button" className="btn soft" onClick={() => deleteComment(c.id)}>
                        刪除
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
