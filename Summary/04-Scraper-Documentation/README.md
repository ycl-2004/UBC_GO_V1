# Scraper Documentation

## 🚀 Overview

This folder contains comprehensive documentation for all scraper scripts used in UBC PathFinder. The scrapers fetch data from UBC official websites and process it for use in the application.

## 📂 File Guide

### Scraper Scripts

| Script | Purpose |
|--------|---------|
| `scrape_admission_requirements.py` | Scrapes general admission requirements for Canadian high school students |
| `scrape_detailed_requirements.py` | Scrapes province-specific detailed requirements for all 13 provinces |
| `scrape_engineering_prereqs.py` | Scrapes prerequisite data for all 13 UBC Engineering majors |
| `scrape_ubc_courses.py` | Scrapes course data from UBC Academic Calendar |
| `apply_province_mappings.py` | Applies province-specific course code mappings |
| `process_admission_data.py` | Processes admission requirements data |
| `process_detailed_requirements.py` | Processes detailed requirements data |

## 🛠️ Complete Workflow

### Two-Phase Scraping System

UBC website only provides **generic course descriptions** (like "A Grade 12 English"), not province-specific course codes (like Alberta's "English Language Arts 30-1").

#### Phase 1: Scrape Generic Requirements

```bash
cd scraper
python3 scrape_detailed_requirements.py
```

This generates: `scraper/data/vancouver_detailed_requirements.json`

**What it does:**
- Visits `https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/`
- Iterates through all 13 provinces
- Scrapes requirements for all 20 degrees for each province
- Saves raw data with generic course descriptions

**Estimated Time:** ~15-20 minutes (depends on network speed)

#### Phase 2: Apply Province-Specific Mappings

```bash
cd ..
python3 scraper/apply_province_mappings.py
```

This will:
1. Read `scraper/province_course_mappings.json` (contains course code mappings for all provinces)
2. Convert generic requirements to province-specific course codes
3. Generate enhanced data:
   - `scraper/data/vancouver_detailed_requirements_enhanced.json`
   - `src/data/detailed_requirements_enhanced.json` (automatically copied to frontend)

**Estimated Time:** ~2-3 seconds

### Complete Workflow Command

```bash
# 1. Run scraper (scrape generic requirements)
cd scraper
python3 scrape_detailed_requirements.py

# 2. Apply province mappings (generate precise course codes)
cd ..
python3 scraper/apply_province_mappings.py

# 3. Frontend automatically uses src/data/detailed_requirements_enhanced.json
# No additional steps needed, just refresh browser
```

### One-Command Update

```bash
cd scraper && \
python3 scrape_detailed_requirements.py && \
cd .. && \
python3 scraper/apply_province_mappings.py && \
cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json && \
echo "✅ Data updated! Refresh browser to see latest data."
```

## 📋 Admission Requirements Scraper

### Functionality

This scraper specifically scrapes admission requirements for Canadian high school students from:

**Source Website**: https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/

### Data Scraped

#### 1. General Admission Requirements
- High school graduation requirements
- Grade 11/12 English minimum grade requirements (70%)
- Recommended number of Grade 12 courses

#### 2. English Language Requirements
- English proficiency standards
- Related links and descriptions

#### 3. Degree-Specific Requirements
For different degrees (Arts, Science, Commerce, Engineering, etc.):
- Required courses
- Recommended courses
- Minimum grade requirements
- Additional requirements and notes

#### 4. Requirements for Two Campuses
- Vancouver campus
- Okanagan campus

### Installation Steps

#### 1. Install Python Dependencies

```bash
cd scraper
pip install -r requirements.txt
```

#### 2. Install ChromeDriver (for Selenium)

**macOS**:
```bash
brew install chromedriver
```

**Windows**:
Download from https://chromedriver.chromium.org/ and add to PATH

**Linux**:
```bash
sudo apt-get install chromium-chromedriver
```

### Usage

#### Step 1: Run Scraper

```bash
python scrape_admission_requirements.py
```

This will automatically:
1. Launch Chrome browser (headless mode)
2. Visit UBC admission requirements page
3. Scrape general requirements
4. Iterate through all degree options and scrape specific requirements
5. Save data to JSON files

#### Step 2: Process Data

```bash
python process_admission_data.py
```

This will:
1. Organize scraped data
2. Categorize by Faculty
3. Extract key information (minimum GPA, competitive GPA)
4. Generate frontend-ready format

### Output Files

#### Raw Data (in `scraper/data/` directory)
- `general_admission_requirements.json` - General admission requirements
- `vancouver_degree_requirements.json` - Vancouver campus degree requirements
- `okanagan_degree_requirements.json` - Okanagan campus degree requirements
- `all_admission_requirements.json` - All data combined

#### Processed Data (in `src/data/` directory)
- `admission_requirements.json` - Complete admission requirements for frontend
- `calculator_admission_data.json` - Data for Calculator page

## 📋 Detailed Requirements Scraper

### Functionality

This enhanced scraper scrapes from UBC official website:
1. **General Admission Requirements** - Basic requirements all students must meet
2. **Province-Specific Requirements** - Specific requirements for each province
3. **Degree-Specific Requirements** - Detailed requirements for each degree in each province
   - Grade 12 required courses
   - Grade 11 recommended courses
   - Related course categories

### Data Structure Scraped

```
├── General Requirements (Generic)
│   ├── English Language Requirement
│   └── General Admission Requirements
│
└── Provinces (13 provinces)
    ├── Alberta
    ├── British Columbia
    ├── Ontario
    └── ... (other provinces)
        ├── General Requirements (province-specific)
        └── Degrees (each degree)
            ├── Arts
            ├── Science
            ├── Commerce
            └── ... (other degrees)
                ├── Grade 12 Requirements
                ├── Grade 11 Requirements
                ├── Related Courses
                └── Additional Info
```

### Usage

#### Step 1: Run Detailed Scraper

```bash
cd scraper
python3 scrape_detailed_requirements.py
```

This will:
- Automatically get all province list
- Automatically get all degree list
- Iterate through each province and degree combination
- Scrape detailed requirement information
- Save to `scraper/data/vancouver_detailed_requirements.json`

**Estimated Time**: 10-20 minutes (depends on number of degrees)

#### Step 2: Process Data

```bash
python3 process_detailed_requirements.py
```

This will:
- Organize data structure
- Categorize degrees by Faculty
- Generate frontend-ready JSON
- Save to `src/data/detailed_requirements.json`

#### Step 3: Check Results

```bash
# Check raw data
cat scraper/data/vancouver_detailed_requirements.json | head -50

# Check processed data
cat src/data/detailed_requirements.json | head -50
```

### Frontend Integration

The Calculator page has been enhanced with:

1. **RequirementsSection Component**
   - Displays general admission requirements
   - Province selector
   - Degree-specific requirements
   - Official links

2. **Dynamic Display**
   - Dynamically updates based on selected Faculty
   - Displays province-specific requirements based on selected province
   - Automatically adapts to different degrees

3. **Fallback Data**
   - Uses preset data if JSON file doesn't exist
   - Ensures website is always available

## 🔄 Mapping Examples

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

## 📊 Supported Provinces

Current mappings cover all 13 provinces:
1. ✅ Alberta
2. ✅ British Columbia
3. ✅ Ontario
4. ✅ Saskatchewan
5. ✅ Manitoba
6. ✅ Quebec
7. ✅ New Brunswick
8. ✅ Newfoundland & Labrador
9. ✅ Nova Scotia
10. ✅ Prince Edward Island
11. ✅ Northwest Territories
12. ✅ Nunavut
13. ✅ Yukon

## 🔧 Adding New Province Mappings

Edit `scraper/province_course_mappings.json`, following existing format to add new province course code mappings.

## 📈 Statistics

- **386 province-specific mappings applied**
- Covers 13 provinces × 20 degrees
- Precise to specific course codes and credits

## 🎯 Frontend Display

Frontend directly displays province-specific course codes, for example:

**Alberta - Applied Biology**
Grade 12 requirements:
- English Language Arts 30-1
- Math 30-1 or Math 31 (5 credits)
- Biology 30, Chemistry 30, or Physics 30

Grade 11 requirements:
- Chemistry 20
- Physics 20

## 🔄 Scraper Updates

### Technical Updates

#### HTML Tag Support
- Added support for multiple HTML tags (h5, h4, h3, h2, strong, div)
- Improved text extraction with `separator=' '` to preserve complete text

#### Wait Times
- Increased wait times (5s → 8s → 4s) to ensure dynamic content loads
- Uses `WebDriverWait` and `expected_conditions` for better reliability

#### Logic Improvements
- Better handling of dynamic content
- Improved error handling
- More robust element selection

## 📝 Usage Instructions

### Step-by-Step Scraper Usage

1. **Install Dependencies**
   ```bash
   cd scraper
   pip install -r requirements.txt
   ```

2. **Install ChromeDriver**
   ```bash
   brew install chromedriver  # macOS
   ```

3. **Run Scraper**
   ```bash
   python3 scrape_detailed_requirements.py
   ```

4. **Apply Mappings**
   ```bash
   cd ..
   python3 scraper/apply_province_mappings.py
   ```

5. **Copy to Frontend**
   ```bash
   cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json
   ```

6. **Refresh Browser**
   - If dev server is running, it will auto-detect changes
   - Refresh browser to see updated data

## ✅ Current Feature Status

### Working Scrapers
- ✅ Admission requirements scraper
- ✅ Detailed requirements scraper (13 provinces)
- ✅ Engineering prerequisites scraper
- ✅ Course data scraper

### Data Processing
- ✅ Province-specific course code mapping
- ✅ Requirements verification
- ✅ Data structure organization

### Coverage
- ✅ 13 Canadian provinces/territories
- ✅ 20 UBC degree programs
- ✅ 13 Engineering majors

## 🆘 Troubleshooting

### Scraper Errors

**Problem: "No such element"**
- Website structure may have changed
- Run with `--debug` flag to save HTML for inspection
- Check selectors in scraper code

**Problem: Timeout errors**
- Increase wait times in scraper code
- Check network connection
- Verify UBC website is accessible

**Problem: ChromeDriver not found**
- Install ChromeDriver and ensure it's in PATH
- Verify ChromeDriver version matches Chrome browser version

### Data Issues

**Problem: Frontend shows generic descriptions**
- Ensure Step 2 (apply mappings) was run
- Check `src/data/detailed_requirements_enhanced.json` exists
- Verify mapping file is correct

**Problem: Some provinces don't have specific codes**
- That province may not have mappings yet
- Edit `scraper/province_course_mappings.json` to add mappings

## 📚 General Scraper Guide

### Best Practices

1. **Be Respectful**: Scrapers include delays between requests
2. **Update Frequency**: Recommend updating data once per semester
3. **Data Verification**: Always verify scraped data for accuracy
4. **Error Handling**: Check for errors and handle gracefully

### Data Accuracy

- Scraped data should be verified, as website structures may change
- Always cross-reference with official UBC website
- Update mappings when course codes change

### Maintenance

- Monitor UBC website for structural changes
- Update selectors if website structure changes
- Keep ChromeDriver version updated
- Test scrapers regularly

---

**Last Updated:** December 18, 2024  
**Status:** ✅ Complete - All scrapers working

