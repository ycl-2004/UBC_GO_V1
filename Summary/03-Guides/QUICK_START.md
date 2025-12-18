# 🚀 快速開始指南

## ✅ 當前狀態

你的網站已經可以使用了！數據文件已經創建完成。

## 📋 使用步驟

### 步驟 1: 啟動網站

```bash
cd /Users/yichenlin/Desktop/UBC_GO
npm run dev
```

網站會在 http://localhost:5173 啟動

### 步驟 2: 訪問 Calculator 頁面

1. 打開瀏覽器
2. 訪問: http://localhost:5173/calculator
3. 向下滾動查看 **Admission Requirements** section

### 步驟 3: 測試功能

- ✅ 選擇不同的 Faculty（Arts, Science, Sauder）
- ✅ 選擇不同的省份（British Columbia, Alberta, Ontario）
- ✅ 查看動態更新的錄取要求
- ✅ 查看 Grade 12 必修課程
- ✅ 查看相關課程類別

## 🔄 如果需要更新數據

### 選項 A: 使用現有數據（推薦）

數據文件已經在 `src/data/detailed_requirements.json`，可以直接使用。

### 選項 B: 運行 Scraper 抓取最新數據

```bash
# 1. 進入 scraper 目錄
cd scraper

# 2. 安裝依賴（如果還沒安裝）
pip3 install -r requirements.txt

# 3. 運行 scraper（需要 10-20 分鐘）
python3 scrape_detailed_requirements.py

# 4. 處理數據
python3 process_detailed_requirements.py

# 5. 重啟前端查看新數據
cd ..
npm run dev
```

## 📁 重要文件位置

- **前端數據**: `src/data/detailed_requirements.json`
- **Scraper 原始數據**: `scraper/data/vancouver_detailed_requirements.json`
- **前端組件**: `src/components/RequirementsSection.jsx`
- **Calculator 頁面**: `src/pages/CalculatorPage.jsx`

## 🎯 功能檢查清單

- [x] Calculator 頁面
- [x] Faculty 選擇器
- [x] Requirements Section
- [x] 省份選擇器
- [x] 動態要求顯示
- [x] Grade 12 課程列表
- [x] 相關課程類別
- [x] 官方鏈接

## ⚠️ 注意事項

1. **ChromeDriver**: 如果運行 scraper，需要安裝 ChromeDriver
   ```bash
   brew install chromedriver  # macOS
   ```

2. **數據更新**: 建議每學期更新一次數據

3. **Fallback 數據**: 如果 JSON 文件不存在，網站會使用預設數據

## 🆘 問題排查

### 網站無法訪問
```bash
# 檢查端口是否被占用
lsof -ti:5173
# 如果被占用，殺掉進程
kill -9 $(lsof -ti:5173)
# 重新啟動
npm run dev
```

### Scraper 錯誤
- 確保 ChromeDriver 已安裝
- 確保網絡連接正常
- 檢查 UBC 網站是否可訪問

### 數據不顯示
- 檢查 `src/data/detailed_requirements.json` 是否存在
- 檢查瀏覽器控制台是否有錯誤
- 確認 RequirementsSection 組件已正確導入

## 📞 下一步

1. ✅ 啟動網站: `npm run dev`
2. ✅ 訪問 Calculator 頁面
3. ✅ 測試所有功能
4. ✅ 如果需要，運行 scraper 更新數據

一切就緒！🎉

