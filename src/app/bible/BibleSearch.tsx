'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  highlightKeywordParts,
  parseSearchKeywords,
  prefetchBibleSearchAssets,
  searchBible,
  type BibleBookMeta,
  type BibleSearchHit,
  type BibleSearchScope,
  type BibleSearchScopeKind,
} from '../../data/bible'

const SCOPE_LABELS: { kind: BibleSearchScopeKind; label: string }[] = [
  { kind: 'all', label: '全書' },
  { kind: 'OT', label: '舊約' },
  { kind: 'NT', label: '新約' },
  { kind: 'book', label: '本卷' },
  { kind: 'range', label: '章節範圍' },
]

type Props = {
  books: BibleBookMeta[]
  /** Prefill scope when opened from a book/chapter page. */
  defaultBookId?: string
  defaultChapter?: number
  compact?: boolean
}

export function BibleSearch({ books, defaultBookId, defaultChapter, compact }: Props) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<BibleSearchScopeKind>(
    defaultBookId ? 'book' : 'all',
  )
  const [bookId, setBookId] = useState(defaultBookId || books[0]?.id || 'Gen')
  const [chapterFrom, setChapterFrom] = useState(defaultChapter || 1)
  const [chapterTo, setChapterTo] = useState(defaultChapter || 1)
  const [hits, setHits] = useState<BibleSearchHit[]>([])
  const [truncated, setTruncated] = useState(false)
  const [status, setStatus] = useState('')
  const [searched, setSearched] = useState(false)
  const [pending, startTransition] = useTransition()

  const selectedBook = useMemo(
    () => books.find((b) => b.id === bookId) || books[0],
    [books, bookId],
  )

  useEffect(() => {
    prefetchBibleSearchAssets()
  }, [])

  useEffect(() => {
    if (defaultBookId) setBookId(defaultBookId)
  }, [defaultBookId])

  useEffect(() => {
    if (defaultChapter) {
      setChapterFrom(defaultChapter)
      setChapterTo(defaultChapter)
    }
  }, [defaultChapter])

  useEffect(() => {
    if (!selectedBook) return
    setChapterFrom((n) => Math.min(Math.max(1, n), selectedBook.chapterCount))
    setChapterTo((n) => Math.min(Math.max(1, n), selectedBook.chapterCount))
  }, [selectedBook])

  const keywords = useMemo(() => parseSearchKeywords(query), [query])

  function runSearch() {
    const q = query.trim()
    if (!q) {
      setHits([])
      setTruncated(false)
      setSearched(false)
      setStatus('請輸入關鍵字。')
      return
    }

    const scope: BibleSearchScope = {
      kind,
      bookId: kind === 'book' || kind === 'range' ? bookId : undefined,
      chapterFrom: kind === 'range' ? chapterFrom : undefined,
      chapterTo: kind === 'range' ? chapterTo : undefined,
    }

    setStatus('搜尋本地和合本…')
    startTransition(() => {
      void (async () => {
        try {
          const result = await searchBible(q, scope, 80)
          setHits(result.hits)
          setTruncated(result.truncated)
          setSearched(true)
          setStatus(
            result.hits.length
              ? `找到 ${result.hits.length}${result.truncated ? '+' : ''} 節`
              : '沒有符合的經節',
          )
        } catch {
          setHits([])
          setTruncated(false)
          setSearched(true)
          setStatus('搜尋失敗，請稍後再試。')
        }
      })()
    })
  }

  return (
    <section className={`bible-search${compact ? ' is-compact' : ''}`} aria-label="經文搜尋">
      <form
        className="bible-search-form"
        onSubmit={(e) => {
          e.preventDefault()
          runSearch()
        }}
      >
        <label className="bible-search-label" htmlFor="bible-search-q">
          搜尋經文
        </label>
        <div className="bible-search-row">
          <input
            id="bible-search-q"
            type="search"
            enterKeyHint="search"
            placeholder="輸入關鍵字，例如：愛 世人"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? '搜尋中' : '搜尋'}
          </button>
        </div>
      </form>

      <div className="bible-search-scopes" role="radiogroup" aria-label="搜尋範圍">
        {SCOPE_LABELS.map((item) => (
          <button
            key={item.kind}
            type="button"
            role="radio"
            aria-checked={kind === item.kind}
            className={kind === item.kind ? 'choice-chip active' : 'choice-chip'}
            onClick={() => setKind(item.kind)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {kind === 'book' || kind === 'range' ? (
        <div className="bible-search-filters">
          <label>
            書卷
            <select
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
              aria-label="搜尋書卷"
            >
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.name}
                </option>
              ))}
            </select>
          </label>
          {kind === 'range' && selectedBook ? (
            <>
              <label>
                起
                <input
                  type="number"
                  min={1}
                  max={selectedBook.chapterCount}
                  value={chapterFrom}
                  onChange={(e) => setChapterFrom(Number(e.target.value) || 1)}
                  aria-label="起始章"
                />
              </label>
              <label>
                迄
                <input
                  type="number"
                  min={1}
                  max={selectedBook.chapterCount}
                  value={chapterTo}
                  onChange={(e) => setChapterTo(Number(e.target.value) || 1)}
                  aria-label="結束章"
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {status ? <p className="bible-search-status">{status}</p> : null}

      {searched ? (
        <ul className="bible-search-results">
          {hits.map((hit) => (
            <li key={`${hit.bookId}-${hit.chapter}-${hit.verse}`}>
              <Link href={hit.href} className="bible-search-hit">
                <span className="bible-search-ref">
                  {hit.bookName} {hit.chapter}:{hit.verse}
                </span>
                <span className="bible-search-text">
                  {highlightKeywordParts(hit.text, keywords).map((part, i) =>
                    part.type === 'mark' ? (
                      <mark key={i}>{part.value}</mark>
                    ) : (
                      <span key={i}>{part.value}</span>
                    ),
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {truncated ? (
        <p className="bible-search-more">結果較多，已顯示前 {hits.length} 節。可縮小範圍再搜。</p>
      ) : null}
    </section>
  )
}
