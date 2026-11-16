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

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]')
  const href = link?.getAttribute('href') || '/manifest.webmanifest'
  const res = await fetch(href)
  const json = await res.json()
  return {
    ok: res.ok,
    href,
    name: json.name,
    display: json.display,
    start_url: json.start_url,
    theme_color: json.theme_color,
    icons: (json.icons || []).map((i) => i.src),
  }
})
ok('manifest linked', Boolean(manifest.href), manifest.href)
ok('manifest ok', manifest.ok)
ok('manifest name', manifest.name === '光道', manifest.name)
ok('manifest standalone', manifest.display === 'standalone', manifest.display)
ok('manifest start', manifest.start_url === '/' || manifest.start_url === './', String(manifest.start_url))
ok('manifest theme', manifest.theme_color === '#0c1a24', String(manifest.theme_color))
ok('manifest icons', manifest.icons.some((s) => s.includes('192')) && manifest.icons.some((s) => s.includes('512')))

for (const path of ['/icons/icon-192.png', '/icons/icon-512.png', '/apple-touch-icon.png']) {
  const icon = await page.evaluate(async (p) => {
    const res = await fetch(p, { method: 'HEAD' })
    return { ok: res.ok, type: res.headers.get('content-type') || '', path: p }
  }, path)
  ok(`icon ${path}`, icon.ok && icon.type.includes('image'), `${icon.type}`)
}

const sw = await page.evaluate(async () => {
  const res = await fetch('/sw.js')
  const text = await res.text()
  return {
    ok: res.ok,
    type: res.headers.get('content-type') || '',
    skipsApi: text.includes('/api/'),
    hasCache: text.includes('guangdao-shell'),
  }
})
ok('service worker script', sw.ok, sw.type)
ok('sw skips api', sw.skipsApi)
ok('sw cache name', sw.hasCache)

const swReg = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return { supported: false }
  const reg = await navigator.serviceWorker.getRegistration()
  // registration is async after load; wait briefly if needed
  if (reg) return { supported: true, active: Boolean(reg.active || reg.installing || reg.waiting), scope: reg.scope }
  await new Promise((r) => setTimeout(r, 1500))
  const again = await navigator.serviceWorker.getRegistration()
  return {
    supported: true,
    active: Boolean(again?.active || again?.installing || again?.waiting),
    scope: again?.scope || '',
  }
})
ok('sw supported', swReg.supported !== false)
ok('sw registered', swReg.active, JSON.stringify(swReg))

ok('daily hero', await page.getByRole('heading', { name: '每日智慧繪卷' }).isVisible())
ok('no doll speaker framing', (await page.getByText(/公仔讀經|把智慧說得清楚|箴言公仔/).count()) === 0)
await page.getByRole('link', { name: '打開今日故事' }).first().click()
await page.waitForURL('**/daily')
ok('daily route', page.url().includes('/daily'))
ok('daily wisdom', await page.getByText('人生智慧').isVisible())
ok('daily devotion', await page.getByText('當日靈修反思').isVisible())
ok('comment rules', await page.getByText('留言規則').isVisible())
ok(
  'no sample/cron disclaimer',
  (await page.getByText(/示範故事|由 Grok|cron/i).count()) === 0,
)
ok(
  'no doll speaker on daily',
  (await page.getByText(/箴言公仔|希望公仔|把智慧說得清楚|明言公仔|小光公仔/).count()) === 0,
)
const storyBody = await page.locator('.daily-story').first().innerText()
ok('story body without 公仔', !storyBody.includes('公仔'), storyBody.slice(0, 40))
const dailyApi = await page.evaluate(async () => {
  const res = await fetch('/api/daily')
  return res.json()
})
ok('day-one sample title', dailyApi?.story?.title === '一句夠用', dailyApi?.story?.title)
const historyApi = await page.evaluate(async () => {
  const res = await fetch('/api/daily/history')
  return res.json()
})
const early = (historyApi.items || []).filter((i) => i.date < '2026-11-16')
ok('archive starts at day one', early.length === 0, JSON.stringify(early))
const heroImg = page.locator('.daily-hero-media')
await heroImg.waitFor({ state: 'visible', timeout: 15000 })
ok('daily story hero image', await heroImg.isVisible())
const heroSrc = await heroImg.getAttribute('src')
ok('daily hero src', Boolean(heroSrc && (heroSrc.includes('/daily/') || heroSrc.includes('/api/daily/image'))))
const defaultHero = await page.evaluate(async () => {
  const res = await fetch('/daily/default-hero.jpg', { method: 'HEAD' })
  return { ok: res.ok, type: res.headers.get('content-type') || '', len: res.headers.get('content-length') || '' }
})
ok('default hero asset', defaultHero.ok, `${defaultHero.type} ${defaultHero.len}`)
await page.screenshot({ path: `${out}/daily_story.png`, fullPage: true })

await page.getByRole('link', { name: '往日繪卷' }).first().click()
await page.waitForURL('**/daily/archive')
ok('archive route', page.url().includes('/daily/archive'))
ok('archive heading', await page.getByText('往日繪卷').first().isVisible())
ok('archive date picker', await page.locator('input[type="date"]').first().isVisible())
await page.screenshot({ path: `${out}/daily_archive.png`, fullPage: true })
await page.goto(`${base}/daily`, { waitUntil: 'networkidle' })


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

