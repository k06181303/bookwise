# Bookwise 部署指南

## 📋 部署概述

這個專案使用以下部署架構：
- **前端**: Vercel (React + Vite)
- **後端**: Railway (Node.js + Express)
- **資料庫**: Railway MySQL

## 🚀 後端部署 (Railway)

### 1. 準備Railway帳號
1. 前往 [Railway.app](https://railway.app)
2. 使用GitHub帳號登入
3. 連接你的GitHub儲存庫

### 2. 建立Railway專案
1. 點擊 "New Project"
2. 選擇 "Deploy from GitHub repo"
3. 選擇你的bookwise專案
4. 選擇 `server` 資料夾作為根目錄

### 3. 設定環境變數
在Railway專案的Variables頁面新增以下環境變數：

```
PORT=3000
NODE_ENV=production
DB_HOST=<Railway提供的MySQL主機>
DB_PORT=3306
DB_USER=<Railway提供的MySQL使用者>
DB_PASSWORD=<Railway提供的MySQL密碼>
DB_NAME=bookwise
JWT_SECRET=<生成一個強密碼>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### 4. 新增MySQL資料庫
1. 在Railway專案中點擊 "New Service"
2. 選擇 "MySQL"
3. 等待資料庫建立完成
4. 複製資料庫連線資訊到環境變數

### 5. 初始化資料庫
部署完成後，需要初始化資料庫結構：
```bash
# 在Railway控制台執行
npm run init-db
```

## 🌐 前端部署 (Vercel)

### 1. 準備Vercel帳號
1. 前往 [Vercel.com](https://vercel.com)
2. 使用GitHub帳號登入

### 2. 建立Vercel專案
1. 點擊 "New Project"
2. 選擇你的bookwise專案
3. 設定根目錄為 `client`
4. 框架預設會自動偵測為 "Vite"

### 3. 設定環境變數
在Vercel專案的Settings → Environment Variables新增：

```
VITE_API_URL=https://your-backend-domain.railway.app/api
```

### 4. 部署設定
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## 🔧 部署後設定

### 1. 更新CORS設定
確保後端的CORS_ORIGIN環境變數設定為你的Vercel域名：
```
CORS_ORIGIN=https://your-app-name.vercel.app
```

### 2. 測試部署
1. 訪問你的Vercel域名
2. 測試註冊/登入功能
3. 測試記帳功能
4. 檢查統計頁面

## 🔍 故障排除

### 常見問題

1. **CORS錯誤**
   - 檢查後端CORS_ORIGIN設定
   - 確保前端VITE_API_URL正確

2. **資料庫連線失敗**
   - 檢查Railway資料庫狀態
   - 確認資料庫環境變數正確

3. **JWT錯誤**
   - 確保JWT_SECRET已設定
   - 檢查token有效期設定

### 日誌查看
- **Railway**: 在專案頁面查看Deployments → Logs
- **Vercel**: 在專案頁面查看Functions → Logs

## 📝 部署檢查清單

後端部署：
- [ ] Railway專案建立
- [ ] 環境變數設定完成
- [ ] MySQL資料庫建立
- [ ] 資料庫初始化完成
- [ ] 後端服務正常運行

前端部署：
- [ ] Vercel專案建立
- [ ] 環境變數設定完成
- [ ] 建置成功
- [ ] 前端頁面正常載入

整合測試：
- [ ] 前後端API連接正常
- [ ] 用戶註冊/登入功能正常
- [ ] 記帳功能正常
- [ ] 統計頁面正常顯示

## 🎉 部署完成

恭喜！你的Bookwise記帳系統已成功部署上線！

域名：
- 前端：https://your-app-name.vercel.app
- 後端：https://your-backend-name.railway.app

記得定期備份資料庫，並監控系統運行狀況。 