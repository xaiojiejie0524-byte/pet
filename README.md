# 咪咪日常｜寵物成長與生活照護紀錄

以 Next.js App Router 建立的全端範例，包含寵物基本資料、成長回憶與外部媒體連結、體重曲線、日常飲食／飲水／排泄與活動紀錄，以及依物種與情境篩選的照護知識卡。介面為繁體中文、響應式版面。

## 架構與目錄

```text
app/
  api/pets/route.ts       寵物資料 API
  api/entries/route.ts    成長／體重／生活紀錄 API
  layout.tsx              中繼資料與全域樣式載入
  page.tsx                前端主介面與互動圖表
  style.css               響應式視覺樣式
lib/
  db.ts                   PostgreSQL 連線池
  schema.sql              資料表與索引
  validation.ts           輸入驗證、長度限制與標籤清理
.env.example              環境變數範本
vercel.json               Vercel Next.js 專案設定
```

資料表 `pets` 儲存物種、品種、生日與體重單位；`entries` 用 `kind` 區分 memory、weight、daily，並以外鍵連結寵物。媒體欄位 `media_url` 儲存 HTTPS 外部連結，不在此專案內接收或永久保存二進位上傳。

## 本機啟動

需求：Node.js 18.17+ 與可連線的 PostgreSQL。版本及資料庫供應商設定請依部署環境確認。

1. 複製 `.env.example` 為 `.env.local`，填入 `DATABASE_URL`。依資料庫供應商文件設定 TLS；只有在需要 TLS 時才設定 `PG_SSL=true`。
2. 在 PostgreSQL 執行 `lib/schema.sql`。例如安裝 PostgreSQL CLI 後執行：

   ```sh
   psql "$DATABASE_URL" -f lib/schema.sql
   ```

   若供應商不支援 `gen_random_uuid()`，需依該資料庫版本調整 UUID 產生方式。
3. 安裝依賴並啟動：

   ```sh
   npm install
   npm run dev
   ```

4. 開啟 `http://localhost:3000`。沒有設定資料庫或尚未載入 schema 時，API 會回傳可讀錯誤提示，不會提供虛構的持久化儲存。

## GitHub 上傳

在 GitHub 建立空白 repository，然後於專案根目錄：

```sh
git init
git add .
git commit -m "建立寵物成長照護紀錄系統"
git branch -M main
git remote add origin https://github.com/<你的帳號>/<repository>.git
git push -u origin main
```

不要提交 `.env.local`、`.env` 或任何憑證。`.gitignore` 已排除環境檔與暫存目錄。

## 部署至 Vercel

1. 將 GitHub repository 匯入 Vercel，Framework Preset 選 Next.js（通常會自動偵測）。
2. 在 Vercel Project Settings → Environment Variables 設定 `DATABASE_URL`；依資料庫服務商要求設定 `PG_SSL`。勿將真實連線字串放在 GitHub、前端變數或程式碼中。
3. 在部署所用的 PostgreSQL 資料庫執行 `lib/schema.sql`，確認部署環境可從 Vercel Function 網路連線至資料庫。連線池上限可用 `PG_POOL_MAX` 調整；依資料庫連線上限與部署併發量確認適當值，若供應商提供 pooler，通常應依其建議連線方式設定。
4. 部署後建立測試寵物及紀錄，再重新整理頁面確認資料仍存在。推送至連結分支會依 Vercel 專案設定觸發部署。

## Vercel 部署檢查與排錯

- **媒體上傳**：Vercel Serverless Function 的本機檔案系統不適合作為跨請求永久媒體儲存；暫存空間可能在執行結束後消失。此版本只接受 HTTPS 媒體網址。若要提供檔案上傳，需依部署環境確認並整合 S3 相容物件儲存、Cloudinary 等外部服務，使用簽名上傳流程，資料庫僅儲存物件 URL／key。不要把檔案寫進專案目錄或 `/tmp` 當永久資料。
- **資料持久化**：API 以 PostgreSQL 保存資料，並不使用 SQLite 或本機 JSON。未設定 `DATABASE_URL`、schema 未建立、憑證/TLS 錯誤或網路不可達會使 API 回傳 503。檢查 Vercel Function Logs 與供應商連線資訊；應用程式不會回傳堆疊追蹤。
- **Serverless 連線**：每個執行環境都可能建立自己的連線池。若遇到連線耗盡或逾時，檢查資料庫併發限制、pooler 建議、`PG_POOL_MAX`、區域與 TLS 設定。區域 `hkg1` 是設定範例，若資料庫部署地不在香港，請在 `vercel.json` 調整或移除並依實際供應商／Vercel 帳戶可用區域確認。
- **執行時間**：目前 API 是短資料庫操作，未設定自訂 Function 執行上限。Vercel 執行時間、請求大小、區域與方案限制會依產品方案和平台政策改變，部署前請查閱當前 Vercel 文件；不要用同步 API 執行大型媒體轉檔。
- **建置失敗**：確認 Node.js 版本與 `package.json` 依賴安裝成功；檢查 Build Logs 的 TypeScript 或環境變數錯誤。`DATABASE_URL` 只應在伺服器環境使用。
- **路由**：Next.js App Router 的 `/api/pets` 與 `/api/entries` 使用 Node runtime。若自行更換框架或路由，需同步檢查 `vercel.json` 與部署輸出。

## 隱私與待補強項目

此範例目前**沒有帳號登入、授權或多租戶隔離**，資料 API 不可直接用於公開的多使用者正式服務。正式上線前，需整合身分驗證，並將每筆寵物與紀錄查詢限制在已驗證使用者可存取的範圍；同時確認資料庫備份、保存期限與隱私政策。使用者文字欄位有長度限制並以 React 純文字輸出；API 對種類、日期、數值、標籤與媒體 URL 做基本驗證。照護卡片為一般資訊、非醫療診斷，異常請洽獸醫。

## 需依部署環境確認

- PostgreSQL 供應商、資料庫版本、TLS 要求、連線池／pooler、網路存取與備份策略。
- Vercel 專案區域、部署方案對函式執行與請求的實際限制，以及團隊所需的服務額度。
- 如要上傳照片或影片：物件儲存服務、簽名上傳端點、檔案大小／格式限制、存取權限與費用。
- 正式服務所需的登入方式、使用者資料隔離、刪除／匯出流程。

本文件不假設或保證任何第三方服務的免費額度。
