# UBC Course and Admission Requirements Scraper

## 🚀 Overview

This scraper folder contains scripts to fetch data from UBC websites:
1. **Course data** from UBC Academic Calendar (vancouver.calendar.ubc.ca)
2. **Admission requirements** from UBC Admissions (you.ubc.ca)
3. **Engineering prerequisites** from UBC Engineering course planning page

## 📂 File Guide

### Key Scripts and Their Purposes

| Script | Purpose |
|--------|---------|
| `scrape_ubc_courses.py` | Scrapes course data from UBC Academic Calendar |
| `scrape_admission_requirements.py` | Scrapes admission requirements for Canadian high school students |
| `scrape_engineering_prereqs.py` | Scrapes prerequisite data for all 13 UBC Engineering majors |
| `scrape_detailed_requirements.py` | Scrapes detailed admission requirements by province |
| `process_data.py` | Processes scraped course data for frontend use |
| `process_admission_data.py` | Processes admission requirements data |
| `apply_province_mappings.py` | Applies province-specific course code mappings |
| `verify_all_requirements.py` | Validates all requirements data |

## 🛠️ Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install ChromeDriver (for Selenium - required for admission requirements scraper):
   - **macOS**: `brew install chromedriver`
   - **Windows/Linux**: Download from https://chromedriver.chromium.org/

3. Create the data directory:
```bash
mkdir -p data
```

## Usage

### 1. Scrape Course Data

Run the course scraper:
```bash
python scrape_ubc_courses.py
```

The script will prompt you to select which faculty to scrape:
- Faculty of Arts
- Faculty of Science
- Sauder School of Business
- All of the above

### 2. Scrape Admission Requirements

Run the admission requirements scraper (for Canadian high school students):
```bash
python scrape_admission_requirements.py
```

This will scrape from **https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/**:
- General admission requirements
- English language requirements
- Degree-specific requirements for Vancouver and Okanagan campuses

**Note**: This scraper uses Selenium for dynamic content and may take 5-10 minutes to run.

### 3. Scrape Engineering Prerequisites

Run the engineering prerequisites scraper:
```bash
python scrape_engineering_prereqs.py
```

**Basic Usage (Headless):**
```bash
cd scraper
python scrape_engineering_prereqs.py
```

**Debug Mode (Visible Browser):**
```bash
cd scraper
python scrape_engineering_prereqs.py --debug
```

This script scrapes prerequisite data for all 13 UBC Engineering majors from the official UBC Engineering course planning page.

**Engineering Majors Processed:**
- BMEG (Biomedical Engineering)
- CHBE (Chemical and Biological Engineering)
- CIVL (Civil Engineering)
- CPEN (Computer Engineering)
- ELEC (Electrical Engineering)
- ENPH (Engineering Physics)
- ENVL (Environmental Engineering)
- GEOE (Geological Engineering)
- IGEN (Integrated Engineering)
- MANU (Manufacturing Engineering)
- MECH (Mechanical Engineering)
- MINE (Mining Engineering)
- MTRL (Materials Engineering)

**Output:** Generates `src/data/engineering_prereqs.json` with prerequisite mappings.

**Dependencies:** All dependencies are in `requirements.txt`:
- selenium
- beautifulsoup4
- webdriver-manager

### 4. Scrape Detailed Requirements

Run the detailed requirements scraper:
```bash
python scrape_detailed_requirements.py
```

This scrapes province-specific admission requirements for all 13 Canadian provinces.

## Output

### Course Data
Scraped data will be saved to:
- `data/arts_courses.json` - Faculty of Arts courses
- `data/science_courses.json` - Faculty of Science courses
- `data/sauder_courses.json` - Sauder School of Business courses
- `data/all_courses.json` - All courses combined

### Admission Requirements Data
Scraped data will be saved to:
- `data/general_admission_requirements.json` - General requirements
- `data/vancouver_degree_requirements.json` - Vancouver degree-specific requirements
- `data/okanagan_degree_requirements.json` - Okanagan degree-specific requirements
- `data/all_admission_requirements.json` - All admission requirements combined

## Process Data

### Process Course Data

After scraping courses, process the data for frontend use:
```bash
python process_data.py
```

This will create `src/data/courses.json` with organized course data.

### Process Admission Requirements Data

After scraping admission requirements, process the data:
```bash
python process_admission_data.py
```

This will create:
- `src/data/admission_requirements.json` - Organized admission requirements
- `src/data/calculator_admission_data.json` - Data for the admission calculator

## Data Structure

### Course Data
Each course includes:
- `code`: Course code (e.g., "CPSC 110")
- `name`: Course name
- `credits`: Number of credits
- `prerequisites`: Array of prerequisite course codes
- `corequisites`: Array of corequisite course codes
- `description`: Course description
- `category`: Course category (communication, literature, science, elective)
- `faculty`: Faculty name
- `faculty_code`: Faculty code

### Admission Requirements Data
Each degree includes:
- `name`: Degree name
- `required_courses`: List of required courses
- `recommended_courses`: List of recommended courses
- `minimum_grades`: Minimum grade requirements
- `additional_requirements`: Additional requirements
- `notes`: Additional notes and information

## Complete Workflow

```bash
# 1. Scrape course data
python scrape_ubc_courses.py
# Select option (e.g., 4 for all faculties)

# 2. Scrape admission requirements
python scrape_admission_requirements.py

# 3. Process course data
python process_data.py

# 4. Process admission data
python process_admission_data.py

# 5. Check generated files
ls -la data/
ls -la ../src/data/

# 6. Start the frontend to see results
cd ..
npm run dev
```

## Notes

- **Scraper courtesy**: Both scrapers include delays between requests to be respectful to UBC's servers
- **Data accuracy**: Scraped data should be verified, as website structures may change
- **ChromeDriver**: Make sure ChromeDriver version matches your Chrome browser version
- **Update frequency**: Recommended to update data once per semester

## Troubleshooting

### ChromeDriver Issues
```
Error: ChromeDriver not found
```
**Solution**: Install ChromeDriver and ensure it's in your PATH

### Selenium Errors
```
NoSuchElementException
```
**Solution**: Website structure may have changed. Check the selectors in the scraper code.

### Timeout Errors
```
TimeoutException
```
**Solution**: Increase `time.sleep()` delays in the scraper code.

## ✅ Current Feature Status

### Working Scrapers
- ✅ Course data scraper (Arts, Science, Sauder)
- ✅ Admission requirements scraper
- ✅ Engineering prerequisites scraper
- ✅ Detailed requirements scraper (13 provinces)

### Data Processing
- ✅ Course data processing
- ✅ Admission requirements processing
- ✅ Province-specific course code mapping
- ✅ Requirements verification

### Troubleshooting Engineering Prerequisites Scraper

**If the script can't find buttons/tables:**

1. Run in debug mode to see what's happening:
   ```bash
   python scrape_engineering_prereqs.py --debug
   ```

2. Check the debug HTML output in `scraper/data/engineering_prereqs_debug.html`

3. The page structure may have changed. You may need to:
   - Update XPath selectors in `find_major_button()`
   - Update table selectors in `wait_for_table()` and `extract_table_data()`
   - Adjust wait times if the page loads slowly

**Common Issues:**
- **Timeout errors**: Increase wait times in `wait_for_table()`
- **Button not found**: The page structure may have changed - check selectors
- **Empty data**: Verify the table is fully loaded before extraction
