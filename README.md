# 光道 · 每日智慧繪卷

手機優先的聖經／靈修 App：3D 公仔角色讀經得智慧、四福音繪卷、背景音樂，以及當日留言。

## 功能

- **每日繪卷**：公仔角色走進日常情境，帶出提醒、警告、勸戒、鼓勵、安慰、同理、名言與反思
- **當日靈修**：每篇故事附默想與短禱
- **留言**：可分享反思；細字標明規則（禁止粗口等，違規由版主刪除）
- **Grok 生成**：設定 `XAI_API_KEY` 後由 Grok 生成當日故事；未設定則使用示範內容
- **四福音繪卷**：耶穌生平分幕＋經文同步
- **音效設定**：10 首背景 MP3、動畫音效、大自然環境聲

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
