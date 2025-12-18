# UBC PathFinder - Requirements Scraping Workflow (UPDATED)

## 問題背景
UBC 官網只提供**通用課程描述**（如 "A Grade 12 English"），而不提供省份特定的課程代碼（如 Alberta 的 "English Language Arts 30-1"）。

## 解決方案
我們實現了一個**兩階段系統**：

### 階段 1：抓取通用要求
```bash
cd /Users/yichenlin/Desktop/UBC_GO/scraper
python3 scrape_detailed_requirements.py
```
這會生成：`scraper/data/vancouver_detailed_requirements.json`

### 階段 2：應用省份特定映射
```bash
cd /Users/yichenlin/Desktop/UBC_GO
python3 scraper/apply_province_mappings.py
```
這會：
1. 讀取 `scraper/province_course_mappings.json`（包含所有省份的課程代碼映射）
2. 將通用要求轉換為省份特定的課程代碼
3. 生成增強數據：
   - `scraper/data/vancouver_detailed_requirements_enhanced.json`
   - `src/data/detailed_requirements.json`（自動複製到前端）

## 映射示例

### Alberta
- "A Grade 12 English" → `["English Language Arts 30-1", "English Language Arts 30-2"]`
- "A Grade 12 Pre-Calculus" → `["Math 30-1", "Math 31 (5 credits)"]`
- "A Grade 12 Biology" → `["Biology 30"]`
- "Chemistry 11" → `["Chemistry 20"]`
- "Physics 11" → `["Physics 20"]`

### British Columbia
- "A Grade 12 English" → `["English Studies 12", "English First Peoples 12"]`
- "A Grade 12 Pre-Calculus" → `["Pre-Calculus 12"]`
- "A Grade 12 Biology" → `["Anatomy and Physiology 12", "Biology 12"]`

### Ontario
- "A Grade 12 English" → `["ENG4U (English)"]`
- "A Grade 12 Pre-Calculus" → `["MHF4U (Advanced Functions)", "MCV4U (Calculus and Vectors)"]`
- "A Grade 12 Biology" → `["SBI4U (Biology)"]`

## 完整工作流程
```bash
# 1. 運行 scraper（抓取通用要求）
cd /Users/yichenlin/Desktop/UBC_GO/scraper
python3 scrape_detailed_requirements.py

# 2. 應用省份映射（生成精確課程代碼）
cd /Users/yichenlin/Desktop/UBC_GO
python3 scraper/apply_province_mappings.py

# 3. 前端自動使用 src/data/detailed_requirements.json
# 無需額外步驟，刷新瀏覽器即可
```

## 支持的省份
當前映射覆蓋：
1. ✅ Alberta
2. ✅ British Columbia  
3. ✅ Ontario
4. ✅ Saskatchewan
5. ✅ Manitoba
6. ✅ Quebec

其他省份將顯示通用描述，直到添加映射為止。

## 添加新省份映射
編輯 `scraper/province_course_mappings.json`，按照現有格式添加新省份的課程代碼映射。

## 統計
- **應用了 247 個省份特定映射**
- 覆蓋 13 個省份 × 20 個學位
- 精確到具體課程代碼和學分

## 前端顯示
前端會直接顯示省份特定的課程代碼，例如：

**Alberta - Applied Biology**
Grade 12 requirements:
- English Language Arts 30-1
- English Language Arts 30-2
- Math 30-1
- Math 31 (5 credits)
- Biology 30

Grade 11 requirements:
- Chemistry 20
- Physics 20

