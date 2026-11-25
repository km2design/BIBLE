import Link from 'next/link'

export const metadata = {
  title: '私隱說明 · 光道',
  description: '光道如何處理瀏覽、留言與管理資料。',
}

export default function PrivacyPage() {
  return (
    <main className="page legal-page">
      <header className="page-header">
        <Link href="/" className="text-link">
          ← 光道
        </Link>
        <h1>私隱說明</h1>
        <p>簡短說明本 App 會與不會收集甚麼。訪客無需註冊帳戶。</p>
      </header>

      <section className="legal-block">
        <h2>我們會處理的資料</h2>
        <ul>
          <li>
            <strong>每日繪卷留言</strong>：你自願提交的暱稱與內容，存於本 App
            的資料庫，供當日／往日頁面顯示；版主可回覆或刪除。
          </li>
          <li>
            <strong>技術防護</strong>：為防止濫用，短時間內會以 IP
            位址做請求頻率限制（不建立用戶檔案）。
          </li>
          <li>
            <strong>用量統計</strong>
            ：公開成功讀取每日繪卷時，會累加該日瀏覽次數（同一 IP
            每小時同一日最多計一次），供管理後台參考，不作對外「用戶數」宣傳。
          </li>
          <li>
            <strong>音效偏好</strong>：背景樂／環境聲設定只存在你裝置的本機儲存。
          </li>
        </ul>
      </section>

      <section className="legal-block">
        <h2>我們不會做的事</h2>
        <ul>
          <li>不要求訪客登入或提供電郵／電話。</li>
          <li>不出售個人資料；不把留言交予廣告網絡。</li>
          <li>管理後台僅限持有管理員密鑰的營運者。</li>
        </ul>
      </section>

      <section className="legal-block">
        <h2>第三方</h2>
        <p>
          「茶記大作戰」部分集數以 YouTube Shorts
          嵌入播放，該服務按其自身私隱政策運作。聖經經文與音效素材之授權見各頁署名與來源說明。
        </p>
      </section>

      <section className="legal-block">
        <h2>聯絡</h2>
        <p>若需刪除留言或查詢資料處理，請透過你取得本 App 連結的教會／服事單位聯絡版主。</p>
        <p className="legal-updated">最近更新：2026-11-25</p>
      </section>
    </main>
  )
}
