import { redirect } from 'next/navigation'

/** Matthew product UI removed — send visitors to 茶記大作戰. */
export default function MatthewRedirectPage() {
  redirect('/chaji')
}
