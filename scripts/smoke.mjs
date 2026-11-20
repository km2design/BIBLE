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

// Admin fail-closed / optional login when secrets present
const adminMe = await page.evaluate(async () => {
  const res = await fetch('/api/admin/me')
  return { status: res.status, body: await res.json().catch(() => ({})) }
})
if (adminMe.status === 503) {
  ok('admin disabled without secrets', true)
  await page.goto(`${base}/admin`, { waitUntil: 'networkidle' })
  ok('admin page fail-closed', await page.getByText(/未啟用|缺少環境密鑰/).isVisible())
} else {
  ok('admin enabled with secrets', adminMe.status === 401 || adminMe.status === 200, String(adminMe.status))
  const user = process.env.ADMIN_USERNAME || 'ADMIN'
  const pass = process.env.ADMIN_PASSWORD || ''
  if (pass) {
    await page.goto(`${base}/admin`, { waitUntil: 'networkidle' })
    await page.locator('.admin-login input').nth(0).fill(user)
    await page.locator('.admin-login input[type="password"]').fill(pass)
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/login') && r.status() === 200),
      page.getByRole('button', { name: '登入' }).click(),
    ])
    await page.getByRole('button', { name: /單日/ }).waitFor({ state: 'visible', timeout: 10000 })
    ok('admin login', await page.getByRole('button', { name: '登出' }).isVisible())
    ok('admin settings tab', await page.getByRole('button', { name: '設定' }).isVisible())
    await page.getByRole('button', { name: '設定' }).click()
    ok('admin mode a', await page.getByRole('button', { name: /模式 A/ }).isVisible())
    ok('admin mode b', await page.getByRole('button', { name: /模式 B/ }).isVisible())
    ok('admin image manual', await page.getByRole('button', { name: '人手 GEN 圖' }).isVisible())
    ok('admin sync public', await page.getByRole('button', { name: /同步公開/ }).isVisible())
    await page.getByRole('button', { name: /模式 B/ }).click()
    await page.locator('.admin-status').filter({ hasText: /必須核准/ }).waitFor({
      state: 'visible',
      timeout: 10000,
    })
    const modeB = await page.evaluate(async () => {
      const res = await fetch('/api/admin/settings')
      return res.json()
    })
    ok('settings persist mode b', modeB.settings?.publishMode === 'approve_required', JSON.stringify(modeB))
    await page.getByRole('button', { name: /模式 A/ }).click()
    await page.locator('.admin-status').filter({ hasText: /可公開|已切換/ }).waitFor({
      state: 'visible',
      timeout: 10000,
    })
    const modeA = await page.evaluate(async () => {
      const res = await fetch('/api/admin/settings')
      return res.json()
    })
    ok('settings persist mode a', modeA.settings?.publishMode === 'open', JSON.stringify(modeA))

    await page.getByRole('button', { name: '一週預覽' }).click()
    await page.getByRole('button', { name: '預產一週文字' }).waitFor({ state: 'visible', timeout: 10000 })
    ok('admin week tab', await page.getByRole('button', { name: '預產一週文字' }).isVisible())
    const weekGet = await page.evaluate(async () => {
      const res = await fetch('/api/admin/story/week')
      return { status: res.status, body: await res.json() }
    })
    ok('week list api', weekGet.status === 200 && Array.isArray(weekGet.body.items) && weekGet.body.items.length === 7, JSON.stringify(weekGet.body?.items?.length))

    const meDates = await page.evaluate(async () => {
      const me = await (await fetch('/api/admin/me')).json()
      return { today: me.today, tomorrow: me.tomorrow }
    })
    await page.getByRole('button', { name: /單日/ }).click()
    await page.locator('.admin-story').waitFor({ state: 'visible', timeout: 10000 })
    await page.locator('.admin-date-field input[type="date"]').fill(meDates.tomorrow)
    await page.waitForTimeout(1000)
    ok('admin image preview', await page.locator('.admin-image-preview img').isVisible())
    ok('admin text editor', await page.getByText('② 批改文稿').isVisible())
    await page.getByRole('button', { name: /預產文字/ }).click()
    await page.waitForTimeout(2500)
    const titleBox = page.locator('.admin-story input').nth(1)
    await titleBox.fill('煙測明日標題')
    await page.locator('textarea').nth(0).fill('煙測故事正文，可批改後再核准。')
    ok('admin gen image button', await page.getByRole('button', { name: 'GEN 圖', exact: true }).isVisible())
    ok('admin regen image button', await page.getByRole('button', { name: '再 GEN 圖' }).isVisible())
    const previewBefore = await page.locator('.admin-image-preview img').getAttribute('src')
    ok('admin preview src', Boolean(previewBefore && previewBefore.includes('/')))
    const adminImg = await page.evaluate(async (date) => {
      const res = await fetch(`/api/admin/story/image?date=${encodeURIComponent(date)}`)
      return { status: res.status, type: res.headers.get('content-type') || '', tomorrow: date }
    }, meDates.tomorrow)
    ok('admin image endpoint', adminImg.status === 200 && adminImg.type.includes('image'), JSON.stringify(adminImg))
    const publicImg = await page.evaluate(async (date) => {
      const res = await fetch(`/api/daily/image?date=${encodeURIComponent(date)}`)
      return { status: res.status }
    }, adminImg.tomorrow)
    ok('public image route responds', publicImg.status === 200)
    await page.getByRole('button', { name: /儲存核准/ }).click()
    await page.locator('.admin-status').filter({ hasText: /已核准|自動對外公開|立即套用/ }).waitFor({
      state: 'visible',
      timeout: 10000,
    })
    ok(
      'admin save tomorrow',
      await page.locator('.admin-status').filter({ hasText: /已核准|自動對外公開|立即套用/ }).isVisible(),
    )
    // Public must not see tomorrow yet
    const tomorrowLeak = await page.evaluate(async () => {
      const me = await (await fetch('/api/admin/me')).json()
      const res = await fetch(`/api/daily?date=${encodeURIComponent(me.tomorrow)}`)
      return { status: res.status, tomorrow: me.tomorrow }
    })
    ok('tomorrow not public yet', tomorrowLeak.status === 404, JSON.stringify(tomorrowLeak))
    await page.getByRole('button', { name: '留言', exact: true }).click()
    await page.getByText('版主留言').waitFor({ state: 'visible', timeout: 10000 })
    ok('admin comments tab', await page.getByText('版主留言').isVisible())
  }
}
await page.goto(base, { waitUntil: 'networkidle' })

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
ok('daily story title', Boolean(dailyApi?.story?.title), String(dailyApi?.story?.title || ''))
const historyApi = await page.evaluate(async () => {
  const res = await fetch('/api/daily/history')
  return res.json()
})
const early = (historyApi.items || []).filter((i) => i.date < '2026-11-18')
ok('archive starts at day one', early.length === 0, JSON.stringify(early))
const preCutover = await page.evaluate(async () => {
  const a = await fetch('/api/daily?date=2026-11-16')
  const b = await fetch('/api/daily?date=2026-11-17')
  return { d16: a.status, d17: b.status }
})
ok('pre-cutover 16 gone', preCutover.d16 === 404, JSON.stringify(preCutover))
ok('pre-cutover 17 gone', preCutover.d17 === 404, JSON.stringify(preCutover))
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
// honeypot must stay empty; filled honeypot should not create a real comment
const honeypotBlocked = await page.evaluate(async () => {
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Hong_Kong' }).format(new Date()),
      nickname: 'bot',
      body: 'spam payload here',
      website: 'https://spam.example',
      startedAt: Date.now() - 5000,
    }),
  })
  const data = await res.json()
  return { ok: res.ok, id: data.comment?.id }
})
ok('honeypot swallows spam', honeypotBlocked.ok && honeypotBlocked.id === '0', JSON.stringify(honeypotBlocked))
await page.getByRole('button', { name: '送出留言' }).click()
await page.waitForTimeout(800)
ok('comment posted', await page.getByText('今天被安慰到了').first().isVisible())
await page.screenshot({ path: `${out}/daily_comments.png`, fullPage: true })

await page.goto(`${base}/matthew`, { waitUntil: 'networkidle' })
ok('matthew redirects to chaji', page.url().includes('/chaji'))
ok('chaji catalog', await page.getByRole('heading', { name: '茶記大作戰' }).first().isVisible())
ok('chaji intro', await page.getByText(/林小悠帶著兩隻貓/).isVisible())
ok('chaji series a', await page.getByText('減肥大作戰').first().isVisible())
ok('chaji series b', await page.getByText('時空之門').first().isVisible())
ok('chaji catalog watch cue', await page.getByText('觀看 Short').first().isVisible())
await page.screenshot({ path: `${out}/chaji_catalog.png`, fullPage: true })

await page.getByRole('link', { name: /減肥大作戰/ }).first().click()
await page.waitForURL('**/chaji/chaji-ep1-diet')
ok('chaji episode', page.url().includes('/chaji/chaji-ep1-diet'))
ok('chaji episode title', await page.getByRole('heading', { name: '減肥大作戰' }).isVisible())
ok('chaji cover kept', await page.locator('.chaji-hero img').isVisible())
const shortIframe = page.locator('.chaji-short-frame iframe')
ok('chaji short embed', await shortIframe.isVisible())
const embedSrc = (await shortIframe.getAttribute('src')) || ''
ok('chaji short video id', embedSrc.includes('EQKGmYfDg7U'), embedSrc)
ok(
  'chaji youtube fallback',
  await page.getByRole('link', { name: /在 YouTube 開啟/ }).isVisible(),
)
const watchHref = await page.getByRole('link', { name: '觀看本集 Short' }).getAttribute('href')
ok('chaji watch link', watchHref === 'https://www.youtube.com/shorts/EQKGmYfDg7U', String(watchHref))
await page.screenshot({ path: `${out}/chaji_ep1.png`, fullPage: true })

await page.goto(`${base}/chaji/chaji-gospel-ep1-portal`, { waitUntil: 'networkidle' })
ok('chaji gospel episode', page.url().includes('/chaji/chaji-gospel-ep1-portal'))
const gospelSrc = (await page.locator('.chaji-short-frame iframe').getAttribute('src')) || ''
ok('chaji gospel short id', gospelSrc.includes('L7hNZsI2Z3Y'), gospelSrc)
await page.screenshot({ path: `${out}/chaji_gospel_ep1.png`, fullPage: true })

await page.goto(`${base}/watch/mt-baptism`, { waitUntil: 'networkidle' })
ok('watch redirects to chaji', page.url().includes('/chaji'))

await page.goto(`${base}/daily`, { waitUntil: 'networkidle' })
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
ok('library chaji', await page.getByText('茶記大作戰').first().isVisible())

await page.goto(`${base}/devotion`, { waitUntil: 'networkidle' })
ok('devotion page', await page.getByRole('heading', { name: '今日靈修' }).isVisible())

await page.goto(base, { waitUntil: 'networkidle' })
ok('home chaji logo', await page.locator('.brand-chaji-logo').isVisible())
ok('nav chaji', await page.getByRole('navigation').getByRole('link', { name: '茶記' }).isVisible())
await page.screenshot({ path: `${out}/home_with_chaji.png` })

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

