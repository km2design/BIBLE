# 光道 · 每日智慧繪卷

手機優先的聖經／靈修 App：完整和合本讀經、每日智慧繪卷、四福音繪卷、背景音樂，以及當日留言。

## 功能

- **和合本聖經**：完整 66 卷繁體新標點和合本，可自由選舊約／新約書卷 → 章 → 節
  - 來源：eBible.org `cmn-cu89t`（Public Domain），經 midvash/bible-data 整理
  - 本地資產：`public/bible/cuv/`（目錄 + 66 卷 JSON + `search-corpus.json`），閱讀／搜尋皆走同源靜態檔（`cache: 'force-cache'`），不打遠端經文 API
  - 搜尋：全書／舊約／新約／本卷／章節範圍；結果連到章節 `#vN`
  - 重建搜尋語料：`npm run bible:corpus`
  - 署名見閱讀頁與 `public/bible/cuv/SOURCE.md`（含香港／澳門版權提示）
- **每日繪卷**：故事驅動插畫＋角色走進日常情境，帶出提醒、警告、勸戒、鼓勵、安慰、同理、名言與反思
- **當日靈修**：每篇故事附默想與短禱
- **往日繪卷**：`/daily/archive` 與日期選擇，重讀已封存故事與其插畫
- **私隱說明**：`/privacy`（訪客無帳戶；留言／頻率限制／瀏覽計數說明）
- **PWA**：可加到主畫面（manifest + icons + 輕量 service worker；`/api/*` 不攔截）
- **管理後台** `/admin`：隔日繪卷預先生成（文字＋插畫預覽／可重產）、批改全部文稿後核准、留言回覆與刪除（需 `ADMIN_USERNAME`／`ADMIN_PASSWORD`；缺密鑰則後台關閉，公開站仍可用）
  - **發布模式**：預設／設定讀取失敗時為模式 B（必須核准）。模式 A 需明確選擇。
  - **每日營運（模式 B）**：每晚一週預產 → 單日批改 → GEN 圖 → 儲存核准（至少核准明日）；說明見後台「設定」。
  - **同步公開**：設定頁按鈕／`POST /api/admin/story/sync-public`；一次性 DB 同步亦由 **cron** 觸發（不在公開 `/api/daily`）。
  - **往日＋統計**：全部已存故事列表（展開留言）、近 30 日瀏覽／留言數
- **留言**：可分享反思；細字標明規則（禁止粗口等，違規由版主刪除）
- **Grok 生成（可自動化）**：設定 `XAI_API_KEY` 後由 Grok 生成當日故事與插畫；未設定則示範故事＋預設英雄圖
  - 排程端點：`POST /api/cron/daily-story`（需 `CRON_SECRET`，timing-safe 比對；每小時最多 3 次）
  - GitHub Actions：`.github/workflows/daily-story.yml`（約 00:10 HKT）— repo 需同時設 `CRON_SECRET` 與 `APP_URL`，缺一則 workflow **失敗退出**；首次上線請手動 Run workflow 驗證（應回 200 JSON）
  - 「今日」依 `Asia/Hong_Kong` 日曆計算
- **茶記大作戰**：Shorts 目錄與播放
- **音效設定**：光道專用 BGM（見 `public/audio/bgm/SOURCE.md`）＋ CC0 大自然環境聲（`public/audio/nature/SOURCE.md`）

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
