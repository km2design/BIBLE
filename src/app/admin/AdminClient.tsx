'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { DailyStory, WisdomKind } from '../../data/dailyStories'

type Tab = 'tomorrow' | 'today' | 'comments'

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
  const [tab, setTab] = useState<Tab>('tomorrow')
  const [story, setStory] = useState<DailyStory>(EMPTY)
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [comments, setComments] = useState<AdminComment[]>([])
  const [commentDate, setCommentDate] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyParent, setReplyParent] = useState<string | null>(null)

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
      username?: string
    }
    setAuthed(Boolean(data.authenticated))
    if (data.today) setToday(data.today)
    if (data.tomorrow) setTomorrow(data.tomorrow)
    if (data.today) setCommentDate(data.today)
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
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '載入失敗')
        return
      }
      setStory(data.story ? { ...data.story, date } : { ...EMPTY, date })
      setSource(data.source || '')
    } finally {
      setBusy(false)
    }
  }, [])

  const loadComments = useCallback(async (date: string) => {
    const res = await fetch(`/api/admin/comments?date=${encodeURIComponent(date)}&all=1`)
    const data = (await res.json()) as { comments?: AdminComment[] }
    if (res.ok) setComments(data.comments || [])
  }, [])

  useEffect(() => {
    if (!authed) return
    if (tab === 'comments') {
      void loadComments(commentDate || today)
    } else {
      const date = tab === 'tomorrow' ? tomorrow : today
      if (date) void loadStory(date)
    }
  }, [authed, tab, today, tomorrow, commentDate, loadStory, loadComments])

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

  async function generate() {
    const date = tab === 'tomorrow' ? tomorrow : today
    setBusy(true)
    setStatus('')
    try {
      const res = await fetch('/api/admin/story/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      })
      const data = (await res.json()) as {
        story?: DailyStory
        source?: string
        message?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '生成失敗')
        return
      }
      if (data.story) setStory({ ...data.story, date })
      if (data.source) setSource(data.source)
      setStatus(data.message || '已生成')
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    const date = tab === 'tomorrow' ? tomorrow : today
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
        message?: string
        error?: string
      }
      if (!res.ok) {
        setStatus(data.error || '儲存失敗')
        return
      }
      if (data.story) setStory(data.story)
      if (data.source) setSource(data.source)
      setStatus(data.message || '已儲存')
    } finally {
      setBusy(false)
    }
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

      <nav className="admin-tabs" aria-label="管理分頁">
        <button
          type="button"
          className={tab === 'tomorrow' ? 'active' : undefined}
          onClick={() => setTab('tomorrow')}
        >
          明日繪卷 · {tomorrow}
        </button>
        <button
          type="button"
          className={tab === 'today' ? 'active' : undefined}
          onClick={() => setTab('today')}
        >
          今日 · {today}
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

      {tab !== 'comments' ? (
        <section className="admin-story">
          <p className="admin-meta">
            來源：{source || '—'} · {busy ? '處理中…' : '可編輯'}
          </p>
          <div className="admin-actions">
            <button type="button" className="btn soft" onClick={generate} disabled={busy}>
              預先生成
            </button>
            <button type="button" className="btn primary" onClick={save} disabled={busy}>
              儲存核准
            </button>
          </div>
          <label>
            標題
            <input
              value={story.title}
              onChange={(e) => setStory({ ...story, title: e.target.value })}
            />
          </label>
          <label>
            故事
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
            經文
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
            靈修內容
            <textarea
              rows={3}
              value={story.devotion}
              onChange={(e) => setStory({ ...story, devotion: e.target.value })}
            />
          </label>
          <label>
            禱告
            <textarea
              rows={2}
              value={story.prayer}
              onChange={(e) => setStory({ ...story, prayer: e.target.value })}
            />
          </label>
        </section>
      ) : (
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
      )}
    </main>
  )
}
