# 光道 · 每日智慧繪卷

手機優先的聖經／靈修 App：完整和合本讀經、3D 公仔每日智慧、四福音繪卷、背景音樂，以及當日留言。

## 功能

- **和合本聖經**：完整 66 卷繁體新標點和合本，可自由選舊約／新約書卷 → 章 → 節
  - 來源：eBible.org `cmn-cu89t`（Public Domain），經 midvash/bible-data 整理
  - 署名見閱讀頁與 `public/bible/cuv/SOURCE.md`
- **每日繪卷**：公仔角色走進日常情境，帶出提醒、警告、勸戒、鼓勵、安慰、同理、名言與反思
- **當日靈修**：每篇故事附默想與短禱
- **留言**：可分享反思；細字標明規則（禁止粗口等，違規由版主刪除）
- **Grok 生成（可自動化）**：設定 `XAI_API_KEY` 後由 Grok 生成當日故事；未設定則使用示範內容
  - 排程端點：`POST /api/cron/daily-story`（需 `CRON_SECRET`）
  - GitHub Actions：`.github/workflows/daily-story.yml`（香港時間約 00:10）
  - 「今日」依 `Asia/Hong_Kong` 日曆計算
- **四福音繪卷**：耶穌生平分幕＋經文同步
- **音效設定**：10 首背景 MP3、動畫音效、CC0 真實大自然環境錄音（可循環）

## 開發

```bash
npm install
env -u DATABASE_URL npm run dev
env -u DATABASE_URL npm run smoke
```

## 技術

- Next.js App Router + TypeScript
- Postgres（發布環境）／PGlite（本機）
- Web Audio + MP3 背景樂
- 靜態和合本 JSON（按卷載入）
