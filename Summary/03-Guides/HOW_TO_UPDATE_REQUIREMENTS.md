# 📚 如何更新 UBC PathFinder 的入學要求數據

## 🎯 快速開始（一鍵更新）

```bash
cd /Users/yichenlin/Desktop/UBC_GO/scraper && \
python3 scrape_detailed_requirements.py && \
cd .. && \
python3 scraper/apply_province_mappings.py && \
cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json && \
echo "✅ 數據已更新！刷新瀏覽器即可看到最新數據。"
```

## 📋 分步驟操作

### 步驟 1：抓取 UBC 官網最新數據

```bash
cd /Users/yichenlin/Desktop/UBC_GO/scraper
python3 scrape_detailed_requirements.py
```

**這一步會做什麼？**

- 訪問 `https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/`
- 遍歷所有 13 個省份
- 為每個省份抓取所有 20 個學位的要求
- 保存到：`scraper/data/vancouver_detailed_requirements.json`

**預計時間：** ~15-20 分鐘（取決於網絡速度）

### 步驟 2：應用省份特定課程代碼映射

```bash
cd /Users/yichenlin/Desktop/UBC_GO
python3 scraper/apply_province_mappings.py
```

**這一步會做什麼？**

- 讀取步驟 1 的數據
- 讀取省份映射規則：`scraper/province_course_mappings.json`
- 將通用描述（"A Grade 12 English"）轉換為具體代碼（"English Language Arts 30-1"）
- 合併多個選項到單行（"Math 30-1" 和 "Math 31" → "Math 30-1 or Math 31 (5 credits)"）
- 保存增強數據到：
  - `scraper/data/vancouver_detailed_requirements_enhanced.json`（增強版數據）
  - 需要手動複製到 `src/data/detailed_requirements_enhanced.json`（前端使用）

**預計時間：** ~2-3 秒

### 步驟 3：複製增強數據到前端

```bash
cd /Users/yichenlin/Desktop/UBC_GO
cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json
```

### 步驟 4：驗證更新

```bash
# 檢查文件大小和更新時間
ls -lh src/data/detailed_requirements_enhanced.json

# 查看 Alberta Applied Biology 的數據（應該看到合併的課程代碼）
python3 -c "
import json
with open('src/data/detailed_requirements_enhanced.json') as f:
    data = json.load(f)
    print('Alberta Applied Biology Grade 12:')
    for req in data['provinces']['Alberta']['degrees']['Applied Biology']['grade_12_requirements']:
        print(f'  • {req}')
"
```

**預期輸出：**

```
• English Language Arts 30-1
• Math 30-1 or Math 31 (5 credits)
• Biology 30, Chemistry 30, or Physics 30
```

### 步驟 5：刷新前端

1. 如果開發服務器正在運行，它會自動檢測文件變化
2. 刷新瀏覽器（`Cmd+Shift+R` 或 `Ctrl+Shift+R`）
3. 測試：選擇 Alberta → Applied Biology → 應該看到：
   - ✅ 單行顯示："Math 30-1 or Math 31 (5 credits)"
   - ✅ 單行顯示："Biology 30, Chemistry 30, or Physics 30"

## 🔧 故障排查

### 問題 1：Scraper 報錯 "No such element"

**原因：** 網頁結構可能改變  
**解決：**

```bash
# 保存當前頁面 HTML 用於調試
cd /Users/yichenlin/Desktop/UBC_GO/scraper
python3 scrape_detailed_requirements.py --debug
# 檢查 scraper/data/debug_page.html
```

### 問題 2：前端顯示通用描述而非具體代碼

**原因：** 可能忘記運行步驟 2  
**解決：**

```bash
cd /Users/yichenlin/Desktop/UBC_GO
python3 scraper/apply_province_mappings.py
```

### 問題 3：某些省份沒有精確代碼

**原因：** 該省份可能還沒有映射  
**解決：** 編輯 `scraper/province_course_mappings.json` 添加新省份映射

## 📝 添加新省份映射

編輯 `scraper/province_course_mappings.json`：

```json
{
  "mappings": {
    "新省份名稱": {
      "A Grade 12 English": ["該省的 Grade 12 英語課程代碼"],
      "A Grade 12 Pre-Calculus": ["該省的 Grade 12 Pre-Calculus 課程代碼"],
      "A Grade 12 Biology": ["該省的 Grade 12 Biology 課程代碼"],
      "A Grade 12 Chemistry": ["該省的 Grade 12 Chemistry 課程代碼"],
      "A Grade 12 Physics": ["該省的 Grade 12 Physics 課程代碼"],
      "Chemistry 11": ["該省的 Grade 11 Chemistry 課程代碼"],
      "Physics 11": ["該省的 Grade 11 Physics 課程代碼"]
    }
  }
}
```

然後重新運行步驟 2。

## ⏰ 推薦更新頻率

| 時機                           | 原因                 |
| ------------------------------ | -------------------- |
| **每學年開始前（6-7 月）**     | UBC 可能更新入學要求 |
| **當收到用戶反饋數據不準確時** | 及時修正錯誤         |
| **添加新省份映射後**           | 確保新映射生效       |

## 📊 驗證數據質量

```bash
# 檢查每個省份的映射數量
cd /Users/yichenlin/Desktop/UBC_GO
python3 -c "
import json
with open('src/data/detailed_requirements.json', 'r') as f:
    data = json.load(f)
    for prov, prov_data in data['provinces'].items():
        degrees = prov_data.get('degrees', {})
        if isinstance(next(iter(degrees.values()), {}), dict):
            # Flat structure
            total = len(degrees)
        else:
            # Nested structure
            total = sum(len(faculty) for faculty in degrees.values())
        print(f'{prov}: {total} degrees')
"
```

## 🎉 成功標誌

當你完成更新後，應該能看到：

- ✅ Alberta 顯示 "English Language Arts 30-1"（不是 "A Grade 12 English"）
- ✅ Ontario 顯示 "ENG4U"（不是 "A Grade 12 English"）
- ✅ BC 顯示 "English Studies 12"（不是 "A Grade 12 English"）
- ✅ 所有 13 個省份 × 20 個學位都有數據

## 🆘 需要幫助？

查看以下文件獲取更多信息：

- `SOLUTION_SUMMARY.md` - 系統架構和技術細節
- `scraper/UPDATED_WORKFLOW.md` - 工作流程詳解
- `REQUIREMENTS_SCRAPER_GUIDE.md` - Scraper 使用指南
