import { ChapterReader } from './ChapterReader'

export default async function BibleChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>
}) {
  const { book, chapter } = await params
  const n = Number.parseInt(chapter, 10)
  return <ChapterReader bookId={book} chapter={Number.isFinite(n) ? n : 1} />
}
