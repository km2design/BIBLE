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

ok('daily hero', await page.getByRole('heading', { name: '每日公仔智慧' }).isVisible())
await page.getByRole('link', { name: '打開今日故事' }).first().click()
await page.waitForURL('**/daily')
ok('daily route', page.url().includes('/daily'))
ok('daily wisdom', await page.getByText('人生智慧').isVisible())
ok('daily devotion', await page.getByText('當日靈修反思').isVisible())
ok('comment rules', await page.getByText('留言規則').isVisible())
await page.screenshot({ path: `${out}/daily_story.png`, fullPage: true })

const nick = page.getByPlaceholder('怎麼稱呼你')
await nick.waitFor({ state: 'visible', timeout: 15000 })
await nick.scrollIntoViewIfNeeded()
await nick.fill('小羊')
await page.getByPlaceholder('分享你的反思、鼓勵或禱告…').fill('今天被安慰到了，謝謝。')
await page.getByRole('button', { name: '送出留言' }).click()
await page.waitForTimeout(800)
ok('comment posted', await page.getByText('今天被安慰到了').first().isVisible())
await page.screenshot({ path: `${out}/daily_comments.png`, fullPage: true })

await page.goto(`${base}/matthew`, { waitUntil: 'networkidle' })
ok('matthew catalog', await page.getByRole('heading', { name: '馬太福音繪卷' }).isVisible())
await page.getByRole('link', { name: /從「/ }).click()
await page.waitForURL('**/watch/mt-magi')
ok('matthew start', page.url().includes('/watch/mt-magi'))
ok('matthew title', await page.getByText('博士來朝').first().isVisible())
await page.screenshot({ path: `${out}/matthew_watch.png` })

await page.goto(`${base}/watch/mt-baptism`, { waitUntil: 'networkidle' })
ok('watch route', page.url().includes('/watch/mt-baptism'))
await page.getByRole('tab', { name: '經文' }).click()
ok('verse tab', await page.getByText('天國近了，你們應當悔改').isVisible())

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
const natureStatus = await page.evaluate(async () => {
  const res = await fetch('/audio/nature/sea.mp3', { method: 'HEAD' })
  return { ok: res.ok, type: res.headers.get('content-type') || '', len: res.headers.get('content-length') || '' }
})
ok('nature mp3 served', natureStatus.ok, `${natureStatus.type} ${natureStatus.len}`)
const naturePlay = await page.evaluate(async () => {
  const audio = new Audio('/audio/nature/rain.mp3')
  audio.loop = true
  try {
    await audio.play()
    await new Promise((r) => setTimeout(r, 400))
    const ok = !audio.paused && audio.currentTime > 0
    audio.pause()
    return { ok, time: audio.currentTime }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})
ok('nature mp3 plays', naturePlay.ok, JSON.stringify(naturePlay))
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

await page.goto(`${base}/bible`, { waitUntil: 'networkidle' })
ok('bible catalog', await page.getByRole('heading', { name: '和合本聖經' }).isVisible())
ok('bible ot books', await page.getByText('創世記').isVisible())
await page.getByRole('tab', { name: '新約' }).click()
ok('bible nt books', await page.getByText('約翰福音').isVisible())
await page.getByRole('link', { name: /約翰福音/ }).click()
await page.waitForURL('**/bible/John')
const chapter3 = page.getByRole('link', { name: '3', exact: true })
await chapter3.waitFor({ state: 'visible', timeout: 15000 })
ok('bible chapters', await chapter3.isVisible())
await chapter3.click()
await page.waitForURL('**/bible/John/3')
await page.getByText(/上帝愛世人/).waitFor({ state: 'visible', timeout: 15000 })
ok('bible verse', await page.getByText(/上帝愛世人/).isVisible())
await page.screenshot({ path: `${out}/bible_john3.png`, fullPage: true })

console.log(log.join('\n'))
console.log('ALL_SMOKE_PASSED')
await browser.close()

