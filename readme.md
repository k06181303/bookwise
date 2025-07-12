📘 中文開發者文檔 README（Bookwise & QuickTicket）
🧩 專案一：Bookwise 記帳助理
🔍 專案簡介
Bookwise 是一個小型記帳系統，支援登入註冊、記帳分類、金額紀錄，並以乾淨結構、錯誤記錄、效能優化為開發重點，適合作為面試用展示專案。

🧰 使用技術
技術	用途	為何選擇
React 18 + Vite	前端框架	快速、模組化、狀態管理清晰
Material UI + Bootstrap 5 + Sass	UI 框架	美觀且彈性，展示元件整合能力
Node.js + Express	後端 API 框架	簡潔高效、RESTful 支援佳
MySQL + mysql2	資料庫	多人使用、穩定性佳，取代 SQLite
JWT + bcrypt	登入驗證與密碼保護	無狀態登入，安全性高
winston	錯誤日誌	可輸出錯誤至檔案，便於追蹤
express-validator	請求驗證	避免不合法資料入庫
dotenv	設定管理	隱藏敏感資料與 port 等設定

🧱 專案結構簡述
bookwise/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.jsx
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── db/                  ← MySQL 資料庫連線管理
│   ├── utils/logger.js      ← log 錯誤紀錄
│   ├── docs/技術說明.md
│   └── index.js


🪵 錯誤紀錄範例：server/utils/logger.js
const fs = require('fs');
const path = require('path');

function logError(msg) {
  const time = new Date().toISOString();
  const filepath = path.join(__dirname, '../logs/error.log');
  fs.appendFileSync(filepath, `[${time}] ${msg}\n`);
}
module.exports = { logError };


🌐 部署方式
項目	服務	說明
前端	Vercel	自動化部署、免費 CDN、HTTPS
後端	Railway	一鍵部署 Node.js 專案，可綁定 MySQL
資料庫	Railway MySQL	Railway 提供 MySQL 可直接連線

 註解原則
✅ 所有重要邏輯、模組皆使用自然中文註解

✅ 包含「為何這樣設計」、「此行用途」、「安全性理由」等說明



Bookwise	server/docs/技術說明.md	每項後端技術的使用原因與優勢