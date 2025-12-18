# UBC Admission Requirements Scraper - 使用指南

## 功能說明

這個 scraper 專門從 UBC 官方網站抓取加拿大高中學生的錄取要求：

**來源網站**: https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/

## 抓取的數據

### 1. 一般錄取要求 (General Admission Requirements)
- 高中畢業要求
- Grade 11/12 英語最低成績要求 (70%)
- 推薦的 Grade 12 課程數量

### 2. 英語語言要求 (English Language Requirements)
- 英語能力標準
- 相關鏈接和說明

### 3. 學位特定要求 (Degree-Specific Requirements)
針對不同學位（如 Arts, Science, Commerce, Engineering 等）的具體要求：
- 必修課程
- 推薦課程
- 最低成績要求
- 附加要求和說明

### 4. 兩個校區的要求
- Vancouver 校區
- Okanagan 校區

## 安裝步驟

### 1. 安裝 Python 依賴

```bash
cd scraper
pip install -r requirements.txt
```

### 2. 安裝 ChromeDriver (用於 Selenium)

**macOS**:
```bash
brew install chromedriver
```

**Windows**:
從 https://chromedriver.chromium.org/ 下載並添加到 PATH

**Linux**:
```bash
sudo apt-get install chromium-chromedriver
```

## 使用方法

### 步驟 1: 運行 Scraper

```bash
python scrape_admission_requirements.py
```

這會自動：
1. 啟動 Chrome 瀏覽器（無頭模式）
2. 訪問 UBC 錄取要求頁面
3. 抓取一般要求
4. 遍歷所有學位選項並抓取特定要求
5. 保存數據到 JSON 文件

### 步驟 2: 處理數據

```bash
python process_admission_data.py
```

這會：
1. 整理抓取的數據
2. 按 Faculty 分類
3. 提取關鍵信息（最低 GPA、競爭 GPA）
4. 生成前端可用的格式

## 輸出文件

### 原始數據 (在 `scraper/data/` 目錄)
- `general_admission_requirements.json` - 一般錄取要求
- `vancouver_degree_requirements.json` - Vancouver 校區學位要求
- `okanagan_degree_requirements.json` - Okanagan 校區學位要求
- `all_admission_requirements.json` - 所有數據合併

### 處理後的數據 (在 `src/data/` 目錄)
- `admission_requirements.json` - 前端用的完整錄取要求
- `calculator_admission_data.json` - Calculator 頁面用的數據

## 數據結構

### admission_requirements.json

```json
{
  "general_requirements": {
    "english_language": {
      "title": "English Language Requirement",
      "description": "...",
      "standard_link": "..."
    },
    "general_admission": {
      "title": "General Admission Requirements",
      "requirements": [
        "Graduation from high school",
        "Minimum of 70% in Grade 11 or Grade 12 English",
        "..."
      ]
    }
  },
  "faculties": {
    "Faculty of Arts": {
      "name": "Faculty of Arts",
      "campus": "Vancouver",
      "degrees": {
        "Arts": {
          "required_courses": [...],
          "recommended_courses": [...],
          "notes": "..."
        }
      }
    }
  }
}
```

### calculator_admission_data.json

```json
{
  "faculties": {
    "arts": {
      "name": "Faculty of Arts",
      "minimum_gpa": 70,
      "competitive_gpa": 85,
      "degrees": ["Arts", "Psychology", "Economics", ...]
    }
  }
}
```

## 整合到前端

處理後的數據可以直接整合到：

1. **Calculator 頁面**: 使用 `calculator_admission_data.json` 來：
   - 更新 GPA 閾值
   - 顯示各 Faculty 的要求
   - 提供更準確的錄取機率計算

2. **Planner 頁面**: 使用 `admission_requirements.json` 來：
   - 顯示畢業要求
   - 推薦必修課程
   - 檢查先修條件

## 注意事項

1. **動態內容**: UBC 網站使用動態內容，必須使用 Selenium
2. **運行時間**: 完整抓取可能需要 5-10 分鐘
3. **網站結構變化**: 如果 UBC 更新網站結構，scraper 可能需要調整
4. **禮貌性**: Scraper 包含適當的延遲，避免過度請求

## 問題排查

### ChromeDriver 錯誤
```
Error: ChromeDriver not found
```
**解決**: 確保 ChromeDriver 已安裝並在 PATH 中

### 無法找到元素
```
NoSuchElementException
```
**解決**: 網站結構可能已更改，需要更新選擇器

### 超時錯誤
```
TimeoutException
```
**解決**: 增加 `time.sleep()` 的延遲時間

## 下次更新

建議每學期更新一次數據，以確保錄取要求是最新的。

## 示例命令流程

```bash
# 1. 抓取錄取要求
python scrape_admission_requirements.py

# 2. 處理數據
python process_admission_data.py

# 3. 檢查生成的文件
ls -la scraper/data/
ls -la src/data/

# 4. 啟動前端查看結果
cd ..
npm run dev
```

完成後，Calculator 和 Planner 頁面將使用真實的 UBC 錄取要求數據！

