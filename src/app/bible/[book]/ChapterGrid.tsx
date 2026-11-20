'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  loadBibleBook,
  loadBibleIndex,
  type BibleBook,
  type BibleBookMeta,
} from '../../../data/bible'
import { BibleSearch } from '../BibleSearch'

export function ChapterGrid({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BibleBook | null>(null)
  const [books, setBooks] = useState<BibleBookMeta[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [data, index] = await Promise.all([loadBibleBook(bookId), loadBibleIndex()])
        if (!cancelled) {
          setBook(data)
          setBooks(index.books)
        }
      } catch {
        if (!cancelled) setError('找不到這卷書。')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [bookId])

  if (error) {
    return (
      <main className="page bible-page">
        <header className="page-header">
          <Link href="/bible" className="text-link">
            ← 返回書卷
          </Link>
          <h1>無法載入</h1>
          <p>{error}</p>
        </header>
      </main>
    )
  }

  if (!book) {
    return (
      <main className="page bible-page">
        <header className="page-header">
          <p>載入 {bookId}…</p>
        </header>
      </main>
    )
  }

  return (
    <main className="page bible-page">
      <header className="page-header bible-header">
        <Link href="/bible" className="text-link">
          ← 書卷目錄
        </Link>
        <h1>{book.name}</h1>
        <p>
          {book.testament === 'OT' ? '舊約' : '新約'} · 共 {book.chapterCount} 章
        </p>
      </header>

      {books.length ? <BibleSearch books={books} defaultBookId={book.id} compact /> : null}

      <div className="bible-chapter-grid">
        {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map((n) => (
          <Link key={n} href={`/bible/${book.id}/${n}`} className="bible-chapter-chip">
            {n}
          </Link>
        ))}
      </div>
    </main>
  )
}
