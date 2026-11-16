import { redirect } from 'next/navigation'

/** Legacy Matthew watch player removed — send visitors to 茶記大作戰. */
export default async function WatchRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await params
  redirect('/chaji')
}
