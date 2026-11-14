import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = process.env.SMOKE_BASE || 'http://127.0.0.1:3000'
const out = '/opt/cursor/artifacts'
await mkdir(out, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const log = []

function ok(name, pass, detail = '') {
  log.push(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!pass) throw new Error(`${name}: ${detail}`)
}

await page.goto(base, { waitUntil: 'networkidle' })
ok('home brand', await page.getByText('光道', { exact: true }).first().isVisible())
await page.screenshot({ path: `${out}/home_hero.png` })

await page.getByRole('link', { name: '今日繪卷' }).click()
await page.waitForURL('**/daily')
ok('daily route', page.url().includes('/daily'))
ok('daily wisdom', await page.getByText('人生智慧').isVisible())
ok('comment rules', await page.getByText('留言規則').isVisible())
await page.screenshot({ path: `${out}/daily_story.png` })

await page.getByLabel('暱稱').fill('小羊')
await page.getByLabel('留言').fill('今天被安慰到了，謝謝。')
await page.getByRole('button', { name: '送出留言' }).click()
await page.waitForTimeout(800)
ok('comment posted', await page.getByText('今天被安慰到了').isVisible())

await page.goto(`${base}/watch/birth`, { waitUntil: 'networkidle' })
ok('watch route', page.url().includes('/watch/birth'))
await page.getByRole('tab', { name: '經文' }).click()
ok('verse tab', await page.getByText('當那些日子，凱撒亞古士督').isVisible())

const music = page.getByRole('button', { name: /音效/ })
await music.click()
ok('music off', await music.getByText('關').isVisible())
await music.click()
ok('music on', await music.getByText('開').isVisible())

await page.getByRole('link', { name: '音效設定' }).click()
await page.waitForURL('**/settings')
ok('settings page', await page.getByRole('heading', { name: '音效設定' }).isVisible())
await page.getByRole('button', { name: '海邊' }).click()
ok('nature sea', await page.locator('.choice-chip.active', { hasText: '海邊' }).isVisible())
await page.getByRole('button', { name: '寧靜湖' }).click()
ok('bgm lake', await page.locator('.choice-chip.active', { hasText: '寧靜湖' }).isVisible())
const bgmStatus = await page.evaluate(async () => {
  const res = await fetch('/audio/bgm/lake.mp3', { method: 'HEAD' })
  return { ok: res.ok, type: res.headers.get('content-type') || '' }
})
ok('bgm mp3 served', bgmStatus.ok, bgmStatus.type)

await page.goto(`${base}/library`, { waitUntil: 'networkidle' })
ok('library', await page.getByRole('heading', { name: '繪卷目錄' }).isVisible())

await page.goto(`${base}/devotion`, { waitUntil: 'networkidle' })
ok('devotion page', await page.getByRole('heading', { name: '今日靈修' }).isVisible())

console.log(log.join('\n'))
console.log('ALL_SMOKE_PASSED')
await browser.close()
