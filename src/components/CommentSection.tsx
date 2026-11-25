'use client'

import { useEffect, useRef, useState } from 'react'
import { COMMENT_RULES } from '../lib/moderation'

type Comment = {
  id: string
  nickname: string
  body: string
  created_at: string
  parent_id?: string | null
  is_admin?: boolean
}

export function CommentSection({ date }: { date: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [nickname, setNickname] = useState('')
  const [body, setBody] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rules, setRules] = useState(COMMENT_RULES)
  const startedAt = useRef(Date.now())

  async function load() {
    const res = await fetch(`/api/comments?date=${encodeURIComponent(date)}`)
    const data = (await res.json()) as { comments?: Comment[]; rules?: string }
    setComments(data.comments ?? [])
    if (data.rules) setRules(data.rules)
  }

  useEffect(() => {
    startedAt.current = Date.now()
    void load()
  }, [date])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          nickname,
          body,
          website: honeypot,
          startedAt: startedAt.current,
        }),
      })
      const data = (await res.json()) as { error?: string; comment?: Comment }
      if (!res.ok) {
        setError(data.error || '送出失敗')
        return
      }
      setBody('')
      startedAt.current = Date.now()
      if (data.comment && data.comment.id !== '0') {
        setComments((prev) => [...prev, data.comment!])
      } else {
        await load()
      }
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="comment-section">
      <h2>今日留言</h2>
      <form className="comment-form" onSubmit={submit}>
        <label>
          暱稱
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="怎麼稱呼你"
            required
          />
        </label>
        {/* Honeypot — visually hidden; leave empty */}
        <label className="hp-field" aria-hidden="true">
          網站
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
        <label>
          留言
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="分享你的反思、鼓勵或禱告…"
            required
          />
        </label>
        {error ? <p className="comment-error">{error}</p> : null}
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? '送出中…' : '送出留言'}
        </button>
      </form>
      <p className="comment-rules">{rules}</p>

      <ul className="comment-list">
        {comments.length === 0 ? (
          <li className="comment-empty">還沒有留言，來當第一個溫柔回應的人吧。</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className={c.parent_id ? 'comment-reply' : undefined}>
              <strong>
                {c.nickname}
                {c.is_admin ? <span className="comment-admin-badge">版主</span> : null}
              </strong>
              <p>{c.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
