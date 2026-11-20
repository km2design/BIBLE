#!/usr/bin/env node
/**
 * Build a compact local search corpus from packaged CUV book JSON.
 * Run: node scripts/build-bible-search-corpus.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/bible/cuv')
const index = JSON.parse(await readFile(path.join(root, 'index.json'), 'utf8'))
const rows = []

for (const meta of index.books) {
  const book = JSON.parse(
    await readFile(path.join(root, 'books', `${meta.id}.json`), 'utf8'),
  )
  for (const chapter of book.chapters || []) {
    for (const verse of chapter.v || []) {
      const text = String(verse.t || '').trim()
      if (!text) continue
      rows.push([meta.id, chapter.c, verse.n, text])
    }
  }
}

const out = {
  version: index.version || 'cuv',
  builtFrom: 'public/bible/cuv/books',
  stats: {
    books: index.books.length,
    verses: rows.length,
    chapters: index.stats?.chapters ?? null,
  },
  /** [bookId, chapter, verse, text] */
  rows,
}

const outPath = path.join(root, 'search-corpus.json')
await writeFile(outPath, JSON.stringify(out), 'utf8')
const files = (await readdir(path.join(root, 'books'))).filter((f) => f.endsWith('.json'))
console.log(
  `bible search corpus: ${rows.length} verses from ${files.length} books → ${outPath}`,
)
