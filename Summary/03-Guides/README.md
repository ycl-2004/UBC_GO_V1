# User Guides

## 🚀 Overview

This folder contains user guides and how-to documentation for UBC PathFinder. These guides help users get started quickly and maintain the project effectively.

## 📚 Quick Start Guide

### Current Status

Your website is ready to use! Data files have been created and are ready.

### Usage Steps

#### Step 1: Start the Website

```bash
npm run dev
```

The website will start at http://localhost:5173

#### Step 2: Access Calculator Page

1. Open browser
2. Visit: http://localhost:5173/ApplyInfo
3. Scroll down to see **Admission Requirements** section

#### Step 3: Test Features

- ✅ Select different provinces (British Columbia, Alberta, Ontario)
- ✅ Select different degrees (Applied Biology, Applied Science, Arts, etc.)
- ✅ View dynamically updated admission requirements
- ✅ View Grade 12 required courses
- ✅ View related course categories

### Important File Locations

- **Frontend Data**: `src/data/detailed_requirements_enhanced.json`
- **Scraper Raw Data**: `scraper/data/vancouver_detailed_requirements.json`
- **Frontend Component**: `src/components/StepByStepRequirements.jsx`
- **Calculator Page**: `src/pages/ApplyInfoPage.jsx`

### Feature Checklist

- [x] Calculator page
- [x] Province selector
- [x] Requirements Section
- [x] Dynamic requirements display
- [x] Grade 12 course list
- [x] Related course categories
- [x] Official links

### Notes

1. **ChromeDriver**: If running scraper, need to install ChromeDriver
   ```bash
   brew install chromedriver  # macOS
   ```

2. **Data Updates**: Recommend updating data once per semester

3. **Fallback Data**: If JSON file doesn't exist, website will use preset data

### Troubleshooting

**Website Cannot Access**
```bash
# Check if port is occupied
lsof -ti:5173
# If occupied, kill process
kill -9 $(lsof -ti:5173)
# Restart
npm run dev
```

**Scraper Errors**
- Ensure ChromeDriver is installed
- Ensure network connection is normal
- Check if UBC website is accessible

**Data Not Displaying**
- Check if `src/data/detailed_requirements_enhanced.json` exists
- Check browser console for errors
- Confirm StepByStepRequirements component is correctly imported

## 📋 How to Update Requirements

### Quick Start (One-Command Update)

```bash
cd scraper && \
python3 scrape_detailed_requirements.py && \
cd .. && \
python3 scraper/apply_province_mappings.py && \
cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json && \
echo "✅ Data updated! Refresh browser to see latest data."
```

### Step-by-Step Operations

#### Step 1: Scrape Latest Data from UBC Website

```bash
cd scraper
python3 scrape_detailed_requirements.py
```

**What this step does:**

- Visits `https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/`
- Iterates through all 13 provinces
- Scrapes requirements for all 20 degrees for each province
- Saves to: `scraper/data/vancouver_detailed_requirements.json`

**Estimated Time:** ~15-20 minutes (depends on network speed)

#### Step 2: Apply Province-Specific Course Code Mappings

```bash
cd ..
python3 scraper/apply_province_mappings.py
```

**What this step does:**

- Reads data from Step 1
- Reads province mapping rules: `scraper/province_course_mappings.json`
- Converts generic descriptions ("A Grade 12 English") to specific codes ("English Language Arts 30-1")
- Consolidates multiple options to single lines ("Math 30-1" and "Math 31" → "Math 30-1 or Math 31 (5 credits)")
- Saves enhanced data to:
  - `scraper/data/vancouver_detailed_requirements_enhanced.json` (enhanced version)
  - Needs manual copy to `src/data/detailed_requirements_enhanced.json` (frontend use)

**Estimated Time:** ~2-3 seconds

#### Step 3: Copy Enhanced Data to Frontend

```bash
cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json
```

#### Step 4: Verify Update

```bash
# Check file size and update time
ls -lh src/data/detailed_requirements_enhanced.json

# View Alberta Applied Biology data (should see consolidated course codes)
python3 -c "
import json
with open('src/data/detailed_requirements_enhanced.json') as f:
    data = json.load(f)
    print('Alberta Applied Biology Grade 12:')
    for req in data['provinces']['Alberta']['degrees']['Applied Biology']['grade_12_requirements']:
        print(f'  • {req}')
"
```

**Expected Output:**

```
• English Language Arts 30-1
• Math 30-1 or Math 31 (5 credits)
• Biology 30, Chemistry 30, or Physics 30
```

#### Step 5: Refresh Frontend

1. If dev server is running, it will automatically detect file changes
2. Refresh browser (`Cmd+Shift+R` or `Ctrl+Shift+R`)
3. Test: Select Alberta → Applied Biology → Should see:
   - ✅ Single line display: "Math 30-1 or Math 31 (5 credits)"
   - ✅ Single line display: "Biology 30, Chemistry 30, or Physics 30"

### Troubleshooting

#### Problem 1: Scraper Error "No such element"

**Cause:** Web page structure may have changed  
**Solution:**

```bash
# Save current page HTML for debugging
cd scraper
python3 scrape_detailed_requirements.py --debug
# Check scraper/data/debug_page.html
```

#### Problem 2: Frontend Shows Generic Descriptions Instead of Specific Codes

**Cause:** May have forgotten to run Step 2  
**Solution:**

```bash
cd ..
python3 scraper/apply_province_mappings.py
```

#### Problem 3: Some Provinces Don't Have Precise Codes

**Cause:** That province may not have mappings yet  
**Solution:** Edit `scraper/province_course_mappings.json` to add new province mappings

### Adding New Province Mappings

Edit `scraper/province_course_mappings.json`:

```json
{
  "mappings": {
    "New Province Name": {
      "A Grade 12 English": ["That province's Grade 12 English course code"],
      "A Grade 12 Pre-Calculus": ["That province's Grade 12 Pre-Calculus course code"],
      "A Grade 12 Biology": ["That province's Grade 12 Biology course code"],
      "A Grade 12 Chemistry": ["That province's Grade 12 Chemistry course code"],
      "A Grade 12 Physics": ["That province's Grade 12 Physics course code"],
      "Chemistry 11": ["That province's Grade 11 Chemistry course code"],
      "Physics 11": ["That province's Grade 11 Physics course code"]
    }
  }
}
```

Then re-run Step 2.

### Recommended Update Frequency

| Timing | Reason |
|--------|--------|
| **Before each academic year (June-July)** | UBC may update admission requirements |
| **When receiving user feedback about inaccurate data** | Fix errors promptly |
| **After adding new province mappings** | Ensure new mappings take effect |

### Verify Data Quality

```bash
# Check mapping count for each province
cd ..
python3 -c "
import json
with open('src/data/detailed_requirements_enhanced.json', 'r') as f:
    data = json.load(f)
    for prov, prov_data in data['provinces'].items():
        degrees = prov_data.get('degrees', {})
        total = len(degrees)
        print(f'{prov}: {total} degrees')
"
```

### Success Indicators

When you complete the update, you should see:

- ✅ Alberta shows "English Language Arts 30-1" (not "A Grade 12 English")
- ✅ Ontario shows "ENG4U" (not "A Grade 12 English")
- ✅ BC shows "English Studies 12" (not "A Grade 12 English")
- ✅ All 13 provinces × 20 degrees have data

## 🔧 Mapping Fix Summary

### Problem

Requirements were being displayed as separate items instead of consolidated on single lines:

#### ❌ Before:

```
Grade 12 Requirements:
• English Language Arts 30-1
• English Language Arts 30-2
• Math 30-1
• Math 31 (5 credits)
• Biology 30
```

#### ✅ After:

```
Grade 12 Requirements:
• English Language Arts 30-1
• Math 30-1 or Math 31 (5 credits)
• Biology 30, Chemistry 30, or Physics 30
```

### Changes Made

#### 1. Updated Province Mappings (`scraper/province_course_mappings.json`)

**Key Changes:**

- Consolidated math options: `["Math 30-1 or Math 31 (5 credits)"]` instead of separate `["Math 30-1", "Math 31 (5 credits)"]`
- Added combined science requirements: `["Biology 30, Chemistry 30, or Physics 30"]`
- Added Grade 11 mappings with "A" prefix (e.g., `"A Grade 11 Chemistry": ["Chemistry 20"]`)
- Applied to all provinces: Alberta, British Columbia, Ontario, Saskatchewan, Manitoba

**Example Mappings:**

```json
"Alberta": {
  "A Grade 12 Pre-Calculus": ["Math 30-1 or Math 31 (5 credits)"],
  "A Grade 12 Biology, a Grade 12 Chemistry, or a Grade 12 Physics": ["Biology 30, Chemistry 30, or Physics 30"],
  "A Grade 11 Chemistry": ["Chemistry 20"],
  "A Grade 11 Physics": ["Physics 20"]
}
```

#### 2. Updated Frontend to Use Enhanced Data

**File:** `src/components/StepByStepRequirements.jsx`

**Changed:**

```javascript
// Before:
import requirementsData from "../data/detailed_requirements.json";

// After:
import requirementsData from "../data/detailed_requirements_enhanced.json";
```

#### 3. Updated Workflow Scripts

**File:** `scraper/RUN_FULL_SCRAPE.sh`

**Added Step:**

```bash
cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json
```

### Verification

Run this to verify the fix:

```bash
python3 -c "
import json
with open('src/data/detailed_requirements_enhanced.json') as f:
    data = json.load(f)
    alberta = data['provinces']['Alberta']['degrees']

    print('✅ Alberta Applied Biology Grade 12:')
    for req in alberta['Applied Biology']['grade_12_requirements']:
        print(f'   • {req}')

    print('\n✅ Alberta Applied Science (Engineering) Grade 12:')
    for req in alberta['Applied Science (Engineering)']['grade_12_requirements']:
        print(f'   • {req}')
"
```

**Expected Output:**

```
✅ Alberta Applied Biology Grade 12:
   • English Language Arts 30-1
   • Math 30-1 or Math 31 (5 credits)
   • Biology 30, Chemistry 30, or Physics 30

✅ Alberta Applied Science (Engineering) Grade 12:
   • English Language Arts 30-1
   • Math 30-1 or Math 31 (5 credits)
   • Chemistry 30
   • Physics 30
```

### Browser Testing

1. Make sure dev server is running: `npm run dev`
2. Open http://localhost:5173/ApplyInfo
3. Test the following:

**Test Case 1: Alberta Applied Biology**

- Select Province: **Alberta**
- Select Degree: **Applied Biology**
- **Expected:**
  - Grade 12: Single line for math options
  - Grade 12: Single line for science options (all three)

**Test Case 2: Alberta Applied Science (Engineering)**

- Select Province: **Alberta**
- Select Degree: **Applied Science (Engineering)**
- **Expected:**
  - Grade 12: Single line for math options
  - Grade 12: Separate lines for Chemistry 30 and Physics 30 (both required)

**Test Case 3: Other Provinces**

- British Columbia Applied Biology: Should show `"Anatomy and Physiology 12, Biology 12, Chemistry 12, or Physics 12"`
- Ontario Applied Biology: Should show `"SBI4U (Biology), SCH4U (Chemistry), or SPH4U (Physics)"`

### Complete Coverage

**All 13 Provinces/Territories Mapped:**

1. ✅ Alberta
2. ✅ British Columbia
3. ✅ Manitoba
4. ✅ New Brunswick
5. ✅ Newfoundland & Labrador
6. ✅ Northwest Territories
7. ✅ Nova Scotia
8. ✅ Nunavut
9. ✅ Ontario
10. ✅ Prince Edward Island
11. ✅ Quebec
12. ✅ Saskatchewan
13. ✅ Yukon

**Total Mapping Rules: 224**
**Total Mappings Applied: 386**

### Files Modified

1. ✅ `scraper/province_course_mappings.json` - 224 mapping rules for 13 provinces
2. ✅ `src/components/StepByStepRequirements.jsx` - Use enhanced data file
3. ✅ `scraper/RUN_FULL_SCRAPE.sh` - Added copy step for enhanced file
4. ✅ `src/data/detailed_requirements_enhanced.json` - 386 mappings applied

### Next Steps

To apply this fix in the future when updating data:

1. Run the full scrape workflow:

   ```bash
   cd scraper
   ./RUN_FULL_SCRAPE.sh
   ```

2. The script will automatically:
   - Scrape the data
   - Process it
   - Apply province mappings
   - Copy enhanced file to frontend

3. Refresh browser to see updated data

### Notes

- The enhanced data file (`detailed_requirements_enhanced.json`) is now the source of truth for the frontend
- All province-specific course codes are consolidated on single lines as they appear on the UBC website
- The mapping system is extensible - new provinces or courses can be added to `province_course_mappings.json`

---

**Last Updated:** December 18, 2024  
**Status:** ✅ Complete

