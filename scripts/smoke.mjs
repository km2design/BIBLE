import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const base = 'http://127.0.0.1:5173'
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

await page.getByRole('link', { name: '開始觀看' }).click()
await page.waitForURL('**/watch/birth')
ok('watch route', page.url().includes('/watch/birth'))

await page.getByRole('tab', { name: '經文' }).click()
ok('verse tab', await page.getByText('當那些日子，凱撒亞古士督').isVisible())
await page.screenshot({ path: `${out}/watch_verse.png` })

await page.getByRole('tab', { name: '故事' }).click()
ok('story tab', await page.getByText('凱撒亞古士督有旨意下來').isVisible())

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
await page.screenshot({ path: `${out}/settings_audio.png` })
await page.getByRole('button', { name: '返回' }).click()
await page.waitForURL('**/watch/**')

await page.getByRole('button', { name: '下一幕' }).click()
ok('scene 2', await page.getByRole('heading', { name: '馬槽裡的嬰孩' }).isVisible())
await page.getByRole('button', { name: '下一幕' }).click()
ok('scene 3', await page.getByRole('heading', { name: '天使報喜' }).isVisible())
await page.screenshot({ path: `${out}/watch_scene3.png` })

await page.getByRole('button', { name: '進入靈修' }).click()
ok('devotion sheet', await page.getByRole('heading', { name: '簡短禱告' }).isVisible())
await page.screenshot({ path: `${out}/watch_devotion.png` })

await page.goto(`${base}/library`, { waitUntil: 'networkidle' })
ok('library', await page.getByRole('heading', { name: '繪卷目錄' }).isVisible())
await page.screenshot({ path: `${out}/library.png` })

await page.goto(`${base}/devotion`, { waitUntil: 'networkidle' })
ok('devotion page', await page.getByRole('heading', { name: '今日靈修' }).isVisible())
ok('devotion prayer', await page.getByRole('heading', { name: '簡短禱告' }).isVisible())
await page.screenshot({ path: `${out}/devotion_page.png` })

await page.getByRole('navigation', { name: '主要導覽' }).getByRole('link', { name: '繪卷', exact: true }).click()
await page.waitForURL('**/library')
ok('bottom nav library', page.url().includes('/library'))
await page.getByRole('navigation', { name: '主要導覽' }).getByRole('link', { name: '靈修', exact: true }).click()
await page.waitForURL('**/devotion')
ok('bottom nav devotion', page.url().includes('/devotion'))

console.log(log.join('\n'))
console.log('ALL_SMOKE_PASSED')
await browser.close()
