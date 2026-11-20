export type Testament = 'OT' | 'NT'

export type BibleBookMeta = {
  id: string
  bookId: number
  name: string
  abbr: string
  testament: Testament
  chapterCount: number
}

export type BibleIndex = {
  version: string
  name: string
  fullName: string
  year: number
  license: string
  licenseNote: string
  sourceUrl: string
  attribution: string
  stats: { books: number; chapters: number; verses: number }
  books: BibleBookMeta[]
}

export type BibleVerse = { n: number; t: string }
export type BibleChapter = { c: number; v: BibleVerse[] }

export type BibleBook = BibleBookMeta & {
  chapters: BibleChapter[]
}

export type BibleSearchScopeKind = 'all' | 'OT' | 'NT' | 'book' | 'range'

export type BibleSearchScope = {
  kind: BibleSearchScopeKind
  bookId?: string
  chapterFrom?: number
  chapterTo?: number
}

export type BibleSearchHit = {
  bookId: string
  bookName: string
  abbr: string
  testament: Testament
  chapter: number
  verse: number
  text: string
  href: string
}

type SearchCorpus = {
  version: string
  stats: { books: number; verses: number; chapters: number | null }
  rows: [string, number, number, string][]
}

/** Same-origin packaged CUV assets under `public/bible/cuv` (not a remote API). */
export const BIBLE_BASE = '/bible/cuv'

const indexCache = new Map<string, Promise<BibleIndex>>()
const bookCache = new Map<string, Promise<BibleBook>>()
let corpusPromise: Promise<SearchCorpus> | null = null

async function fetchLocalJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'force-cache' })
  if (!res.ok) throw new Error(`無法載入 ${url}`)
  return (await res.json()) as T
}

export async function loadBibleIndex(): Promise<BibleIndex> {
  const key = 'index'
  let pending = indexCache.get(key)
  if (!pending) {
    pending = fetchLocalJson<BibleIndex>(`${BIBLE_BASE}/index.json`)
    indexCache.set(key, pending)
  }
  return pending
}

export async function loadBibleBook(bookId: string): Promise<BibleBook> {
  const id = bookId.trim()
  let pending = bookCache.get(id)
  if (!pending) {
    pending = fetchLocalJson<BibleBook>(
      `${BIBLE_BASE}/books/${encodeURIComponent(id)}.json`,
    )
    bookCache.set(id, pending)
  }
  return pending
}

async function loadSearchCorpus(): Promise<SearchCorpus> {
  if (!corpusPromise) {
    corpusPromise = fetchLocalJson<SearchCorpus>(`${BIBLE_BASE}/search-corpus.json`)
  }
  return corpusPromise
}

/** Prefetch index + search corpus (local static assets). */
export function prefetchBibleSearchAssets(): void {
  void loadBibleIndex().catch(() => {})
  void loadSearchCorpus().catch(() => {})
}

export function booksByTestament(books: BibleBookMeta[], testament: Testament) {
  return books.filter((b) => b.testament === testament)
}

export function findBookMeta(books: BibleBookMeta[], id: string) {
  return books.find((b) => b.id === id)
}

export function neighborBook(books: BibleBookMeta[], id: string) {
  const i = books.findIndex((b) => b.id === id)
  if (i < 0) return { prev: null, next: null }
  return {
    prev: i > 0 ? books[i - 1] : null,
    next: i < books.length - 1 ? books[i + 1] : null,
  }
}

export function parseSearchKeywords(query: string): string[] {
  return query
    .trim()
    .split(/\s+/u)
    .map((part) => part.trim())
    .filter(Boolean)
}

function normalizeChapterRange(
  from: number | undefined,
  to: number | undefined,
  maxChapter: number,
): { from: number; to: number } | null {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return null
  const a = Math.max(1, Math.min(maxChapter, Math.floor(from as number)))
  const b = Math.max(1, Math.min(maxChapter, Math.floor(to as number)))
  return { from: Math.min(a, b), to: Math.max(a, b) }
}

/**
 * Local keyword search over packaged CUV corpus (no remote verse API).
 * Space-separated keywords must all appear in the verse text.
 */
export async function searchBible(
  query: string,
  scope: BibleSearchScope,
  limit = 80,
): Promise<{ hits: BibleSearchHit[]; truncated: boolean; scanned: number }> {
  const keywords = parseSearchKeywords(query)
  if (keywords.length === 0) return { hits: [], truncated: false, scanned: 0 }

  const [index, corpus] = await Promise.all([loadBibleIndex(), loadSearchCorpus()])
  const metaById = new Map(index.books.map((b) => [b.id, b]))

  let bookFilter: Set<string> | null = null
  let chapterRange: { from: number; to: number } | null = null

  if (scope.kind === 'OT' || scope.kind === 'NT') {
    bookFilter = new Set(
      index.books.filter((b) => b.testament === scope.kind).map((b) => b.id),
    )
  } else if (scope.kind === 'book' || scope.kind === 'range') {
    const bookId = scope.bookId?.trim()
    if (!bookId || !metaById.has(bookId)) {
      return { hits: [], truncated: false, scanned: 0 }
    }
    bookFilter = new Set([bookId])
    if (scope.kind === 'range') {
      const meta = metaById.get(bookId)!
      chapterRange = normalizeChapterRange(
        scope.chapterFrom,
        scope.chapterTo,
        meta.chapterCount,
      )
      if (!chapterRange) return { hits: [], truncated: false, scanned: 0 }
    }
  }

  const hits: BibleSearchHit[] = []
  let scanned = 0
  let truncated = false

  for (const row of corpus.rows) {
    const [bookId, chapter, verse, text] = row
    if (bookFilter && !bookFilter.has(bookId)) continue
    if (chapterRange && (chapter < chapterRange.from || chapter > chapterRange.to)) {
      continue
    }
    scanned += 1
    if (!keywords.every((kw) => text.includes(kw))) continue

    const meta = metaById.get(bookId)
    if (!meta) continue
    hits.push({
      bookId,
      bookName: meta.name,
      abbr: meta.abbr,
      testament: meta.testament,
      chapter,
      verse,
      text,
      href: `/bible/${bookId}/${chapter}#v${verse}`,
    })
    if (hits.length >= limit) {
      truncated = true
      break
    }
  }

  return { hits, truncated, scanned }
}

export function highlightKeywordParts(
  text: string,
  keywords: string[],
): { type: 'text' | 'mark'; value: string }[] {
  if (!keywords.length) return [{ type: 'text', value: text }]
  const escaped = keywords
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!escaped.length) return [{ type: 'text', value: text }]
  const re = new RegExp(`(${escaped.join('|')})`, 'gu')
  const parts: { type: 'text' | 'mark'; value: string }[] = []
  let last = 0
  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0
    if (start > last) parts.push({ type: 'text', value: text.slice(last, start) })
    parts.push({ type: 'mark', value: match[0] })
    last = start + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts.length ? parts : [{ type: 'text', value: text }]
}
