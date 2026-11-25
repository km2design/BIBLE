import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://guangdao.apps.grok.bot'
  const now = new Date()
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/daily`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/bible`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/chaji`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/daily/archive`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
