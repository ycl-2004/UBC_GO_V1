# UBC Detailed Requirements Scraper - 完整指南

## 🎯 功能說明

這個增強版 scraper 會從 UBC 官網抓取：
1. **一般錄取要求** - 所有學生都需要滿足的基本要求
2. **省份特定要求** - 每個省份的具體要求
3. **學位特定要求** - 每個學位在每個省份的詳細要求
   - Grade 12 必修課程
   - Grade 11 建議課程
   - 相關課程類別

## 📊 抓取的數據結構

```
├── General Requirements (通用要求)
│   ├── English Language Requirement
│   └── General Admission Requirements
│
└── Provinces (13個省份)
    ├── Alberta
    ├── British Columbia
    ├── Ontario
    └── ... (其他省份)
        ├── General Requirements (省份特定)
        └── Degrees (每個學位)
            ├── Arts
            ├── Science
            ├── Commerce
            └── ... (其他學位)
                ├── Grade 12 Requirements
                ├── Grade 11 Requirements
                ├── Related Courses
                └── Additional Info
```

## 🚀 使用方法

### 步驟 1: 運行詳細 Scraper

```bash
cd /Users/yichenlin/Desktop/UBC_GO/scraper

# 運行詳細要求 scraper
python3 scrape_detailed_requirements.py
```

這會：
- 自動獲取所有省份列表
- 自動獲取所有學位列表
- 遍歷每個省份和學位的組合
- 抓取詳細的要求信息
- 保存到 `scraper/data/vancouver_detailed_requirements.json`

**預計時間**: 10-20 分鐘（取決於學位數量）

### 步驟 2: 處理數據

```bash
python3 process_detailed_requirements.py
```

這會：
- 整理數據結構
- 按 Faculty 分類學位
- 生成前端可用的 JSON
- 保存到 `src/data/detailed_requirements.json`

### 步驟 3: 檢查結果

```bash
# 檢查原始數據
cat scraper/data/vancouver_detailed_requirements.json | head -50

# 檢查處理後的數據
cat src/data/detailed_requirements.json | head -50
```

## 💻 前端整合

### Calculator 頁面已添加：

1. **RequirementsSection 組件**
   - 顯示一般錄取要求
   - 省份選擇器
   - 學位特定要求
   - 官方鏈接

2. **動態顯示**
   - 根據選擇的 Faculty 動態更新
   - 根據選擇的省份顯示特定要求
   - 自動適配不同學位

3. **Fallback 數據**
   - 如果 JSON 文件不存在，使用預設數據
   - 確保網站始終可用

## 📝 數據示例

### Grade 12 Requirements for Arts (BC)
- English 12

### Related Courses
- Language Arts
- Mathematics and Computation
- Second Languages
- Social Studies
- Visual and Performing Arts

### Grade 12 Requirements for Science (BC)
- English 12
- Pre-Calculus 12 or Calculus 12
- Chemistry 12
- Physics 12

## 🎨 UI 特點

1. **省份選擇器**
   - 下拉選單包含所有加拿大省份和地區
   - 選擇後自動更新要求

2. **要求卡片**
   - 一般要求：灰色背景
   - 學位特定要求：漸變背景
   - 重要鏈接：藍色背景

3. **視覺提示**
   - 📋 一般要求
   - 🎓 學位特定要求
   - 🔗 重要鏈接

4. **顏色編碼**
   - 必修課程：深藍邊框
   - 相關課程：綠色邊框和背景
   - 注意事項：黃色背景

## 🔧 自定義和擴展

### 添加更多省份

在 `scrape_detailed_requirements.py` 中，省份會自動檢測。

### 添加更多學位

學位列表也會自動檢測。可以在 `process_detailed_requirements.py` 中調整 Faculty 分類邏輯。

### 修改 UI

編輯 `RequirementsSection.jsx` 和 `RequirementsSection.css`。

## ⚠️ 注意事項

1. **運行時間**
   - 完整抓取可能需要 10-20 分鐘
   - 包含延遲以避免過度請求

2. **ChromeDriver**
   - 必須安裝並在 PATH 中
   - 版本需與 Chrome 瀏覽器匹配

3. **網站結構變化**
   - 如果 UBC 更新網站，可能需要調整選擇器
   - 檢查 scraper 輸出中的錯誤信息

4. **數據準確性**
   - 建議每學期更新一次
   - 始終參考 UBC 官網以獲取最新信息

## 📦 完整工作流程

```bash
# 1. 運行 scraper
cd /Users/yichenlin/Desktop/UBC_GO/scraper
python3 scrape_detailed_requirements.py

# 2. 處理數據
python3 process_detailed_requirements.py

# 3. 檢查生成的文件
ls -la data/
ls -la ../src/data/

# 4. 啟動前端查看結果
cd ..
npm run dev
```

## 🌐 查看結果

1. 訪問 http://localhost:5173/calculator
2. 選擇一個 Faculty
3. 向下滾動查看 "Admission Requirements" section
4. 選擇不同的省份查看變化
5. 選擇不同的學位查看特定要求

## 🎯 預期結果

Calculator 頁面現在會顯示：
- ✅ 一般錄取要求
- ✅ 省份選擇器
- ✅ Grade 12 必修課程
- ✅ Grade 11 建議課程
- ✅ 相關課程類別
- ✅ 官方 UBC 鏈接
- ✅ 免責聲明

所有信息都是從 UBC 官網實時抓取的真實數據！

