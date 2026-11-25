import { ChapterGrid } from './ChapterGrid'

export default async function BibleBookPage({
  params,
}: {
  params: Promise<{ book: string }>
}) {
  const { book } = await params
  return <ChapterGrid bookId={book} />
}
