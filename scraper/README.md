# UBC Course and Admission Requirements Scraper

This scraper fetches data from UBC websites:
1. **Course data** from UBC Academic Calendar (vancouver.calendar.ubc.ca)
2. **Admission requirements** from UBC Admissions (you.ubc.ca)

## Setup

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

### 2. Scrape Admission Requirements (NEW!)

Run the admission requirements scraper (for Canadian high school students):
```bash
python scrape_admission_requirements.py
```

This will scrape from **https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/**:
- General admission requirements
- English language requirements
- Degree-specific requirements for Vancouver and Okanagan campuses

**Note**: This scraper uses Selenium for dynamic content and may take 5-10 minutes to run.

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

## More Information

See `ADMISSION_SCRAPER_GUIDE.md` for detailed documentation on the admission requirements scraper.
