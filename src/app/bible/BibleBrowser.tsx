'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  booksByTestament,
  loadBibleIndex,
  type BibleBookMeta,
  type BibleIndex,
  type Testament,
} from '../../data/bible'

export function BibleBrowser() {
  const [index, setIndex] = useState<BibleIndex | null>(null)
  const [testament, setTestament] = useState<Testament>('OT')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await loadBibleIndex()
        if (!cancelled) setIndex(data)
      } catch {
        if (!cancelled) setError('載入聖經目錄失敗，請稍後再試。')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const books = useMemo<BibleBookMeta[]>(() => {
    if (!index) return []
    return booksByTestament(index.books, testament)
  }, [index, testament])

  return (
    <main className="page bible-page">
      <header className="page-header bible-header">
        <p className="eyebrow">自由讀經</p>
        <h1>和合本聖經</h1>
        <p>
          {index
            ? `${index.fullName} · ${index.stats.books} 卷 · ${index.stats.chapters} 章`
            : '載入目錄中…'}
        </p>
      </header>

      <div className="bible-tabs" role="tablist" aria-label="約別">
        <button
          type="button"
          role="tab"
          aria-selected={testament === 'OT'}
          className={testament === 'OT' ? 'active' : undefined}
          onClick={() => setTestament('OT')}
        >
          舊約
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={testament === 'NT'}
          className={testament === 'NT' ? 'active' : undefined}
          onClick={() => setTestament('NT')}
        >
          新約
        </button>
      </div>

      {error ? <p className="bible-error">{error}</p> : null}

      <ul className="bible-book-list">
        {books.map((book) => (
          <li key={book.id}>
            <Link href={`/bible/${book.id}`} className="bible-book-row">
              <span className="bible-book-abbr">{book.abbr}</span>
              <span className="bible-book-name">{book.name}</span>
              <span className="bible-book-meta">{book.chapterCount} 章</span>
            </Link>
          </li>
        ))}
      </ul>

      {index ? (
        <p className="bible-attribution">{index.attribution}</p>
      ) : null}
    </main>
  )
}
