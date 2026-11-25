'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  loadBibleBook,
  loadBibleIndex,
  neighborBook,
  type BibleBook,
  type BibleBookMeta,
  type BibleIndex,
} from '../../../../data/bible'
import { BibleSearch } from '../../BibleSearch'

export function ChapterReader({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [book, setBook] = useState<BibleBook | null>(null)
  const [index, setIndex] = useState<BibleIndex | null>(null)
  const [books, setBooks] = useState<BibleBookMeta[]>([])
  const [error, setError] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [b, idx] = await Promise.all([loadBibleBook(bookId), loadBibleIndex()])
        if (!cancelled) {
          setBook(b)
          setIndex(idx)
          setBooks(idx.books)
        }
      } catch {
        if (!cancelled) setError('無法載入本章經文。')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookId])

  const chapterData = useMemo(() => {
    if (!book) return null
    return book.chapters.find((c) => c.c === chapter) ?? null
  }, [book, chapter])

  const neighbors = useMemo(() => {
    if (!index || !book) return { prevHref: null as string | null, nextHref: null as string | null }
    const { prev, next } = neighborBook(index.books, book.id)
    let prevHref: string | null = null
    let nextHref: string | null = null
    if (chapter > 1) prevHref = `/bible/${book.id}/${chapter - 1}`
    else if (prev) prevHref = `/bible/${prev.id}/${prev.chapterCount}`
    if (chapter < book.chapterCount) nextHref = `/bible/${book.id}/${chapter + 1}`
    else if (next) nextHref = `/bible/${next.id}/1`
    return { prevHref, nextHref }
  }, [index, book, chapter])

  useEffect(() => {
    if (!chapterData) return
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    if (!hash.startsWith('#v')) return
    const id = hash.slice(1)
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('is-target')
      window.setTimeout(() => el.classList.remove('is-target'), 2200)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [chapterData, bookId, chapter])

  if (error) {
    return (
      <main className="page bible-page">
        <header className="page-header">
          <Link href="/bible" className="text-link">
            ← 返回
          </Link>
          <h1>載入失敗</h1>
          <p>{error}</p>
        </header>
      </main>
    )
  }

  if (!book || !chapterData) {
    return (
      <main className="page bible-page">
        <header className="page-header">
          <p>載入經文…</p>
        </header>
      </main>
    )
  }

  return (
    <main className="page bible-page bible-reader">
      <header className="bible-reader-top">
        <Link href={`/bible/${book.id}`} className="icon-btn" aria-label="返回章節">
          ←
        </Link>
        <div className="watch-meta">
          <span>{book.name}</span>
          <strong>第 {chapter} 章</strong>
        </div>
        <button
          type="button"
          className="text-link bible-top-link"
          onClick={() => setShowSearch((v) => !v)}
        >
          {showSearch ? '收合搜尋' : '搜尋'}
        </button>
      </header>

      {showSearch && books.length ? (
        <BibleSearch
          books={books}
          defaultBookId={book.id}
          defaultChapter={chapter}
          compact
        />
      ) : null}

      <article className="bible-verses">
        {chapterData.v.map((verse) => (
          <p key={verse.n} id={`v${verse.n}`} className="bible-verse">
            <sup className="bible-verse-num">{verse.n}</sup>
            <span>{verse.t}</span>
          </p>
        ))}
      </article>

      <nav className="bible-chapter-nav" aria-label="章節導覽">
        {neighbors.prevHref ? (
          <Link href={neighbors.prevHref} className="btn soft">
            ← 上一章
          </Link>
        ) : (
          <span />
        )}
        {neighbors.nextHref ? (
          <Link href={neighbors.nextHref} className="btn soft">
            下一章 →
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {index ? (
        <>
          <p className="bible-attribution">{index.attribution}</p>
          <p className="bible-attribution bible-legal-note">
            香港／澳門：或有版權主張；此處依 eBible 公眾領域文本供靈修閱讀。
          </p>
        </>
      ) : null}
    </main>
  )
}
