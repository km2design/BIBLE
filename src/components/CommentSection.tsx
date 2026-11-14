'use client'

import { useEffect, useState } from 'react'
import { COMMENT_RULES } from '../lib/moderation'

type Comment = {
  id: string
  nickname: string
  body: string
  created_at: string
}

export function CommentSection({ date }: { date: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [nickname, setNickname] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rules, setRules] = useState(COMMENT_RULES)

  async function load() {
    const res = await fetch(`/api/comments?date=${encodeURIComponent(date)}`)
    const data = (await res.json()) as { comments?: Comment[]; rules?: string }
    setComments(data.comments ?? [])
    if (data.rules) setRules(data.rules)
  }

  useEffect(() => {
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
        body: JSON.stringify({ date, nickname, body }),
      })
      const data = (await res.json()) as { error?: string; comment?: Comment }
      if (!res.ok) {
        setError(data.error || '送出失敗')
        return
      }
      setBody('')
      if (data.comment) setComments((prev) => [data.comment!, ...prev])
      else await load()
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
            <li key={c.id}>
              <strong>{c.nickname}</strong>
              <p>{c.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
