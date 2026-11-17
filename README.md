# 光道 · 每日智慧繪卷

手機優先的聖經／靈修 App：完整和合本讀經、每日智慧繪卷、四福音繪卷、背景音樂，以及當日留言。

## 功能

- **和合本聖經**：完整 66 卷繁體新標點和合本，可自由選舊約／新約書卷 → 章 → 節
  - 來源：eBible.org `cmn-cu89t`（Public Domain），經 midvash/bible-data 整理
  - 署名見閱讀頁與 `public/bible/cuv/SOURCE.md`
- **每日繪卷**：故事驅動插畫＋角色走進日常情境，帶出提醒、警告、勸戒、鼓勵、安慰、同理、名言與反思
- **當日靈修**：每篇故事附默想與短禱
- **往日繪卷**：`/daily/archive` 與日期選擇，重讀已封存故事與其插畫
- **PWA**：可加到主畫面（manifest + icons + 輕量 service worker；`/api/*` 不攔截）
- **管理後台** `/admin`：隔日繪卷預先生成（文字＋插畫預覽／可重產）、批改全部文稿後核准、留言回覆與刪除（需 `ADMIN_USERNAME`／`ADMIN_PASSWORD`；缺密鑰則後台關閉，公開站仍可用）
  - **發布模式**：模式 A（預產可公開）／模式 B（必須核准；sample／grok 不上街）
  - **同步公開**：設定頁「同步公開（清未核准）」→ `POST /api/admin/story/sync-public`（自 `2026-11-18` 鎖定模式 B、刪 sample／grok、刷新舊公仔核准稿）。亦可「核准草稿並同步」。發布後首次 `/api/daily` 或 cron 會自動跑一次同等同步（`public_sync_v1`）。
- **留言**：可分享反思；細字標明規則（禁止粗口等，違規由版主刪除）
- **Grok 生成（可自動化）**：設定 `XAI_API_KEY` 後由 Grok 生成當日故事與插畫；未設定則示範故事＋預設英雄圖
  - 排程端點：`POST /api/cron/daily-story`（需 `CRON_SECRET`）— **每天一次**文字＋插畫（約 US$0.04–0.05／圖，不在每次頁面瀏覽觸發）
  - 插畫：`grok-imagine-image-2.0`，風格參考 `public/daily/default-hero.jpg`，存入 `daily_stories.image_bytes`
  - GitHub Actions：`.github/workflows/daily-story.yml`（香港時間約 00:10）
  - 「今日」依 `Asia/Hong_Kong` 日曆計算
- **四福音繪卷**：耶穌生平分幕＋經文同步
- **音效設定**：10 首背景 MP3、動畫音效、CC0 真實大自然環境錄音（可循環）

## 開發

```bash
npm install
env -u DATABASE_URL npm run dev
env -u DATABASE_URL npm run smoke
# 本機啟用後台（勿把密碼寫進程式碼）
# ADMIN_USERNAME=ADMIN ADMIN_PASSWORD='…' env -u DATABASE_URL npm run dev
```

發布環境請在 Cursor App Secrets 設定 `ADMIN_USERNAME`（建議 `ADMIN`）、`ADMIN_PASSWORD`，以及既有的 `XAI_API_KEY`／`CRON_SECRET`。

重複「同步公開」步驟見 `docs` 代理商店說明，或後台設定頁按鈕／`POST /api/admin/story/sync-public`。

## 技術

- Next.js App Router + TypeScript
- Postgres（發布環境）／PGlite（本機）
- Web Audio + MP3 背景樂
- 靜態和合本 JSON（按卷載入）
