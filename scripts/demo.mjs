import { chromium } from 'playwright'

const base = 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  headless: false,
  args: [`--window-size=430,900`, '--window-position=40,40'],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

await page.goto(base, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByRole('link', { name: '開始觀看' }).click()
await page.waitForURL('**/watch/birth')
await page.waitForTimeout(900)
await page.getByRole('tab', { name: '經文' }).click()
await page.waitForTimeout(1000)
await page.getByRole('tab', { name: '故事' }).click()
await page.waitForTimeout(700)
await page.getByRole('button', { name: /背景音樂/ }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /背景音樂/ }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: '下一幕' }).click()
await page.waitForTimeout(900)
await page.getByRole('button', { name: '下一幕' }).click()
await page.waitForTimeout(900)
await page.getByRole('button', { name: '進入靈修' }).click()
await page.waitForTimeout(1400)
await page.goto(`${base}/library`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.goto(`${base}/devotion`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)
await browser.close()
