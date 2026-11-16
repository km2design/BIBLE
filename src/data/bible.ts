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

export const BIBLE_BASE = '/bible/cuv'

export async function loadBibleIndex(): Promise<BibleIndex> {
  const res = await fetch(`${BIBLE_BASE}/index.json`, { cache: 'force-cache' })
  if (!res.ok) throw new Error('無法載入聖經目錄')
  return (await res.json()) as BibleIndex
}

export async function loadBibleBook(bookId: string): Promise<BibleBook> {
  const res = await fetch(`${BIBLE_BASE}/books/${encodeURIComponent(bookId)}.json`, {
    cache: 'force-cache',
  })
  if (!res.ok) throw new Error('無法載入經卷')
  return (await res.json()) as BibleBook
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
