# UBC PathFinder - 完整功能指南

## 🎉 已完成的功能

### 1. ✅ Python 課程數據抓取器
- **位置**: `scraper/scrape_ubc_courses.py`
- **功能**: 從 UBC Academic Calendar 抓取課程數據
- **支持的 Faculty**: Arts, Science, Sauder
- **抓取欄位**: Course Code, Credits, Prerequisites, Corequisites, Description

### 2. ✅ 數據持久化 (localStorage)
- **位置**: `src/utils/storage.js`
- **功能**: 
  - 保存用戶的多個學位計劃
  - 自動保存課程記錄
  - 支持訪客模式和登錄用戶

### 3. ✅ 登錄/註冊系統
- **位置**: `src/pages/LoginPage.jsx`, `src/context/AuthContext.jsx`
- **功能**:
  - 用戶註冊和登錄
  - 多個計劃管理
  - 計劃的創建、加載、刪除

### 4. ✅ 多 Faculty 支持
- **位置**: `src/data/facultiesData.js`
- **支持的 Faculty**:
  - Faculty of Arts
  - Faculty of Science
  - Sauder School of Business
- **每個 Faculty 都有獨立的**:
  - 畢業要求
  - 錄取數據
  - 課程列表

## 📋 使用步驟

### 步驟 1: 抓取 UBC 課程數據

```bash
cd scraper
pip install -r requirements.txt
python scrape_ubc_courses.py
```

選擇要抓取的 Faculty（1-4），腳本會：
- 訪問 UBC Academic Calendar
- 抓取所有課程信息
- 保存為 JSON 文件

### 步驟 2: 處理數據

```bash
python process_data.py
```

這會將抓取的數據轉換為前端可用的格式，生成 `src/data/courses.json`

### 步驟 3: 啟動前端應用

```bash
npm run dev
```

訪問 http://localhost:5173

## 🔧 功能詳解

### Calculator 頁面
- **多 Faculty 支持**: 可以選擇 Arts, Science, 或 Sauder
- **智能算法**: 根據不同 Faculty 的錄取標準計算
- **個性化建議**: 根據結果提供改進建議

### Planner 頁面
- **多計劃管理**: 登錄用戶可以創建多個計劃
- **自動保存**: 所有更改自動保存到 localStorage
- **Faculty 切換**: 可以為不同 Faculty 創建不同計劃
- **進度追蹤**: 實時顯示學分進度和要求完成情況
- **智能推薦**: 根據已修課程推薦下學期課程

### 登錄系統
- **簡單認證**: 使用 localStorage（演示用）
- **計劃同步**: 登錄後可以訪問所有保存的計劃
- **訪客模式**: 未登錄用戶也可以使用，數據保存在本地

## 📁 文件結構

```
UBC_GO/
├── scraper/              # Python 抓取器
│   ├── scrape_ubc_courses.py
│   ├── process_data.py
│   ├── requirements.txt
│   └── data/             # 抓取的數據
├── src/
│   ├── components/      # React 組件
│   ├── pages/           # 頁面組件
│   ├── data/            # 數據文件
│   ├── utils/           # 工具函數
│   └── context/         # React Context
└── package.json
```

## 🎯 下一步建議

1. **運行 Scraper**: 執行 Python 腳本抓取真實的 UBC 課程數據
2. **測試功能**: 
   - 創建賬號並登錄
   - 創建多個計劃
   - 測試不同 Faculty 的計算器
3. **擴展數據**: 抓取更多課程數據以豐富數據庫
4. **後端集成**: 將 localStorage 替換為真實的後端 API

## ⚠️ 注意事項

- **Scraper 禮貌性**: 腳本包含延遲以避免過度請求
- **數據準確性**: 抓取的數據需要驗證，因為網站結構可能變化
- **認證系統**: 當前使用 localStorage，生產環境需要真實的後端認證
- **課程數據**: 如果沒有運行 scraper，會使用預設的樣本數據

## 🚀 快速開始

1. 安裝依賴: `npm install`
2. 啟動開發服務器: `npm run dev`
3. 訪問網站並開始使用！

所有功能已經實現並可以正常使用！

